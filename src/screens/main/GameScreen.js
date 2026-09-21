import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, Pressable, TextInput, StyleSheet, BackHandler, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Screen from '../../components/Screen'
import { colors, fonts, radius } from '../../theme'
import { useGameData } from '../../context/DataProvider'
import { buildGame, refillQueue } from '../../lib/buildGame'
import { shuffle, markAsSeen } from '../../lib/gamePool'
import { isCorrectTextAnswer } from '../../lib/fuzzyMatch'
import { saveGame } from '../../lib/history'
import {
  MODES,
  DEFAULT_TIMES,
  HARD_QUESTION_TIME_LIMIT,
  SURVIVAL_START_TIME,
  SURVIVAL_PENALTIES,
  COUNTDOWN_HARD_PENALTIES,
  MULTIPLAYER_TRANSITION_SECONDS,
} from '../../lib/gameConstants'

const FEEDBACK_MESSAGES = {
  correct: ['Nice! ✅', 'Correct! 🎯', 'You got it! 🙌', 'Sharp! ⚡'],
  wrong: ['Not quite ❌', 'Oops 😬', 'Wrong answer 🚫'],
}

export default function GameScreen({ route, navigation }) {
  const { mode, categoryIds, difficulty, questionCount, timeLimitSeconds, players } = route.params
  const { questions: allQuestions } = useGameData()

  const [playersData, setPlayersData] = useState(null)
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0)
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [answered, setAnswered] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(false)
  const [timeLeft, setTimeLeft] = useState(mode === MODES.SURVIVAL ? SURVIVAL_START_TIME : timeLimitSeconds)
  const [questionTimeLeft, setQuestionTimeLeft] = useState(HARD_QUESTION_TIME_LIMIT)
  const [showTransition, setShowTransition] = useState(false)
  const [ended, setEnded] = useState(false)

  const advanceTimeout = useRef(null)
  const endedRef = useRef(false)

  useEffect(() => {
    buildGame({ mode, categoryIds, difficulty, questionCount, players, allQuestions }).then(setPlayersData)
  }, [])

  // Confirm-before-exit while a game is in progress (Android back button).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (endedRef.current) return false
      Alert.alert('Abandon game?', 'Your progress in this game will be lost.', [
        { text: 'Keep playing', style: 'cancel' },
        { text: 'Abandon', style: 'destructive', onPress: () => navigation.goBack() },
      ])
      return true
    })
    return () => sub.remove()
  }, [navigation])

  const currentPlayer = playersData?.[currentPlayerIdx]
  const currentQuestion = currentPlayer?.queue?.[currentQIdx]

  // Session timer for Countdown/Survival.
  useEffect(() => {
    if (!playersData || ended) return
    if (mode !== MODES.COUNTDOWN && mode !== MODES.SURVIVAL) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          finishGame()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [playersData, ended, mode])

  // Per-question ring timer, Question mode + Hard difficulty only.
  useEffect(() => {
    if (!currentQuestion || answered || ended) return
    if (mode !== MODES.QUESTION || difficulty !== 'hard') return
    setQuestionTimeLeft(HARD_QUESTION_TIME_LIMIT)
    const interval = setInterval(() => {
      setQuestionTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          handleSkip()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [currentQuestion?.id, answered])

  useEffect(() => {
    if (currentQuestion) {
      markAsSeen(categoryIds, difficulty, [currentQuestion.id]).catch(() => {})
    }
  }, [currentQuestion?.id])

  const recordAnswer = useCallback(
    (isCorrect, isSkip, selectedValue) => {
      setPlayersData((prev) => {
        const next = prev.map((p, i) => {
          if (i !== currentPlayerIdx) return p
          const updated = {
            ...p,
            correct: p.correct + (isCorrect ? 1 : 0),
            total: p.total + 1,
          }
          if (mode !== MODES.MULTIPLAYER) {
            updated.answerLog = [
              ...p.answerLog,
              {
                question: currentQuestion.question,
                options: currentQuestion.options,
                selected: selectedValue,
                correctAnswer: currentQuestion.answer,
                isCorrect,
                skipped: isSkip,
              },
            ]
          }
          return updated
        })
        return next
      })

      if (mode === MODES.SURVIVAL) {
        const delta = isSkip ? SURVIVAL_PENALTIES.skip : isCorrect ? SURVIVAL_PENALTIES.correct : SURVIVAL_PENALTIES.wrong
        setTimeLeft((t) => Math.max(0, t + delta))
      } else if (mode === MODES.COUNTDOWN && difficulty === 'hard' && !isCorrect) {
        const delta = isSkip ? COUNTDOWN_HARD_PENALTIES.skip : COUNTDOWN_HARD_PENALTIES.wrong
        setTimeLeft((t) => Math.max(0, t + delta))
      }
    },
    [currentPlayerIdx, currentQuestion, mode, difficulty]
  )

  const handleSelect = (option) => {
    if (answered) return
    const isCorrect = option === currentQuestion.answer
    setSelected(option)
    setLastCorrect(isCorrect)
    setAnswered(true)
    recordAnswer(isCorrect, false, option)
    autoAdvanceIfNeeded()
  }

  const handleTextSubmit = () => {
    if (answered || !textInput.trim()) return
    const isCorrect = isCorrectTextAnswer(textInput, currentQuestion.answer)
    setLastCorrect(isCorrect)
    setAnswered(true)
    recordAnswer(isCorrect, false, textInput)
    autoAdvanceIfNeeded()
  }

  const handleSkip = () => {
    if (answered) return
    setAnswered(true)
    setLastCorrect(false)
    recordAnswer(false, true, null)
    autoAdvanceIfNeeded()
  }

  function autoAdvanceIfNeeded() {
    if (mode === MODES.COUNTDOWN || mode === MODES.SURVIVAL) {
      advanceTimeout.current = setTimeout(() => advance(), 1000)
    }
  }

  useEffect(() => () => advanceTimeout.current && clearTimeout(advanceTimeout.current), [])

  function resetQuestionState() {
    setSelected(null)
    setTextInput('')
    setAnswered(false)
    setLastCorrect(false)
  }

  function advance() {
    if (endedRef.current) return
    const player = playersData[currentPlayerIdx]
    const nextQIdx = currentQIdx + 1

    if (mode === MODES.QUESTION) {
      if (nextQIdx >= Math.min(questionCount, player.queue.length)) {
        finishGame()
        return
      }
      setCurrentQIdx(nextQIdx)
      resetQuestionState()
      return
    }

    if (mode === MODES.MULTIPLAYER) {
      if (nextQIdx >= Math.min(questionCount, player.queue.length)) {
        if (currentPlayerIdx + 1 >= playersData.length) {
          finishGame()
          return
        }
        goToNextPlayer()
        return
      }
      setCurrentQIdx(nextQIdx)
      resetQuestionState()
      return
    }

    // Countdown / Survival: refill queue on exhaustion, timer alone ends the game.
    if (nextQIdx >= player.queue.length) {
      refillQueue(player)
    }
    setCurrentQIdx(nextQIdx)
    resetQuestionState()
  }

  function goToNextPlayer() {
    setShowTransition(true)
    setTimeout(() => {
      setShowTransition(false)
      setCurrentPlayerIdx((i) => i + 1)
      setCurrentQIdx(0)
      resetQuestionState()
    }, MULTIPLAYER_TRANSITION_SECONDS * 1000)
  }

  function finishGame() {
    if (endedRef.current) return
    endedRef.current = true
    setEnded(true)
    const record = {
      mode,
      difficulty,
      players: playersData.map((p) => ({ name: p.name, correct: p.correct, total: p.total })),
      answerLog: playersData.length === 1 ? playersData[0].answerLog : undefined,
    }
    saveGame(record).finally(() => {
      navigation.replace('Results', { playersData, mode })
    })
  }

  if (!playersData) {
    return (
      <Screen>
        <Text style={styles.loading}>Loading questions…</Text>
      </Screen>
    )
  }

  if (showTransition) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={styles.transitionText}>Get ready,</Text>
        <Text style={styles.transitionName}>{playersData[currentPlayerIdx + 1]?.name}!</Text>
      </Screen>
    )
  }

  if (!currentQuestion) {
    return (
      <Screen>
        <Text style={styles.loading}>No questions available for this selection.</Text>
      </Screen>
    )
  }

  const showRingTimer = mode === MODES.QUESTION && difficulty === 'hard'
  const showSessionTimer = mode === MODES.COUNTDOWN || mode === MODES.SURVIVAL

  return (
    <Screen>
      <View style={styles.header}>
        {mode === MODES.MULTIPLAYER && <Text style={styles.playerBadge}>{currentPlayer.name}</Text>}
        <View style={styles.scoreRow}>
          <Ionicons name="checkmark-circle" size={15} color={colors.green} />
          <Text style={styles.scoreText}>
            {currentPlayer.correct} / {currentPlayer.total}
          </Text>
        </View>
        {showSessionTimer && (
          <View style={styles.timerRow}>
            <Ionicons name="time" size={15} color={timeLeft <= 10 ? colors.red : colors.text2} />
            <Text style={[styles.timerText, timeLeft <= 10 && styles.timerLow]}>{timeLeft}s</Text>
          </View>
        )}
        {showRingTimer && (
          <View style={styles.timerRow}>
            <Ionicons name="time" size={15} color={questionTimeLeft <= 10 ? colors.red : colors.text2} />
            <Text style={[styles.timerText, questionTimeLeft <= 10 && styles.timerLow]}>{questionTimeLeft}s</Text>
          </View>
        )}
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </View>

      {currentQuestion.type === 'text' ? (
        <View>
          <TextInput
            style={styles.textInput}
            value={textInput}
            onChangeText={setTextInput}
            autoFocus
            autoCapitalize="characters"
            editable={!answered}
            placeholder="Type your answer"
            placeholderTextColor={colors.text3}
            onSubmitEditing={handleTextSubmit}
          />
          {answered && (
            <Text style={[styles.feedbackText, { color: lastCorrect ? colors.green : colors.red }]}>
              {lastCorrect ? pick(FEEDBACK_MESSAGES.correct) : `${pick(FEEDBACK_MESSAGES.wrong)} — ${currentQuestion.answer}`}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.optionsList}>
          {(answered ? currentQuestion.options : currentQuestion.options).map((opt) => {
            const isAnswer = opt === currentQuestion.answer
            const isSelected = opt === selected
            let optStyle = styles.option
            if (answered) {
              if (isAnswer) optStyle = [styles.option, styles.optionCorrect]
              else if (isSelected) optStyle = [styles.option, styles.optionWrong]
            }
            return (
              <Pressable key={opt} style={[optStyle, styles.optionRow]} onPress={() => handleSelect(opt)} disabled={answered}>
                <Text style={styles.optionText}>{opt}</Text>
                {answered && isAnswer && <Ionicons name="checkmark-circle" size={18} color={colors.green} />}
                {answered && isSelected && !isAnswer && <Ionicons name="close-circle" size={18} color={colors.red} />}
              </Pressable>
            )
          })}
        </View>
      )}

      <View style={styles.footer}>
        {!answered && (
          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
        {answered && (mode === MODES.QUESTION || mode === MODES.MULTIPLAYER) && (
          <Pressable style={styles.nextBtn} onPress={advance}>
            <Text style={styles.nextText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#000" />
          </Pressable>
        )}
      </View>
    </Screen>
  )
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const styles = StyleSheet.create({
  loading: { color: colors.text3, fontFamily: fonts.body, textAlign: 'center', marginTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  playerBadge: { fontFamily: fonts.displaySemibold, color: colors.gold, fontSize: 14 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scoreText: { fontFamily: fonts.bodyMedium, color: colors.text2, fontSize: 13 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timerText: { fontFamily: fonts.displaySemibold, color: colors.text, fontSize: 16 },
  timerLow: { color: colors.red },
  questionCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: 20, marginBottom: 20, minHeight: 100, justifyContent: 'center' },
  questionText: { fontFamily: fonts.displaySemibold, fontSize: 18, color: colors.text, lineHeight: 26 },
  optionsList: { gap: 10 },
  option: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, borderRadius: radius.sm, padding: 14 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionCorrect: { borderColor: colors.green, backgroundColor: 'rgba(46,204,113,0.12)' },
  optionWrong: { borderColor: colors.red, backgroundColor: 'rgba(231,76,60,0.12)' },
  optionText: { fontFamily: fonts.body, color: colors.text, fontSize: 15, flexShrink: 1 },
  textInput: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, borderRadius: radius.sm, padding: 14, color: colors.text, fontFamily: fonts.displaySemibold, fontSize: 16, textTransform: 'uppercase' },
  feedbackText: { marginTop: 12, fontFamily: fonts.bodyMedium, fontSize: 14 },
  footer: { marginTop: 24, alignItems: 'center' },
  skipBtn: { padding: 12 },
  skipText: { color: colors.text3, fontFamily: fonts.bodyMedium },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.gold, paddingVertical: 12, paddingHorizontal: 24, borderRadius: radius.sm },
  nextText: { color: '#000', fontFamily: fonts.displaySemibold, fontSize: 15 },
  transitionText: { color: colors.text3, fontFamily: fonts.body, fontSize: 16 },
  transitionName: { color: colors.gold, fontFamily: fonts.display, fontSize: 32, marginTop: 8 },
})
