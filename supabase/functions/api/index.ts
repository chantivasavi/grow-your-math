const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// SESSION STORE (in-memory)
// ============================================
const sessions: Record<string, {
  current_level: 'easy' | 'medium' | 'hard',
  correct_streak: number,
  wrong_streak: number,
  total_questions: number,
  assessment_completed: boolean,
  assessment_answers: { difficulty: string, correct: boolean }[],
  assessment_questions_given: number,
}> = {}

function getSession(sessionId: string) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      current_level: 'medium',
      correct_streak: 0,
      wrong_streak: 0,
      total_questions: 0,
      assessment_completed: false,
      assessment_answers: [],
      assessment_questions_given: 0,
    }
  }
  return sessions[sessionId]
}

// ============================================
// FORMULAS DATA
// ============================================
const formulasData: Record<string, Record<string, { name: string, formula: string }[]>> = {
  "9": {
    "Algebra": [
      { name: "Linear Equation", formula: "ax + b = 0" },
      { name: "Quadratic Identity", formula: "(a+b)² = a² + 2ab + b²" },
      { name: "Difference of Squares", formula: "a² - b² = (a+b)(a-b)" },
    ],
    "Geometry": [
      { name: "Area of Triangle", formula: "A = ½ × base × height" },
      { name: "Pythagoras Theorem", formula: "a² + b² = c²" },
      { name: "Area of Circle", formula: "A = πr²" },
    ]
  },
  "10": {
    "Algebra": [
      { name: "Quadratic Formula", formula: "x = (-b ± √(b²-4ac)) / 2a" },
      { name: "Sum of AP", formula: "Sn = n/2 [2a + (n-1)d]" },
      { name: "nth term of AP", formula: "an = a + (n-1)d" },
    ],
    "Trigonometry": [
      { name: "sin²θ + cos²θ", formula: "sin²θ + cos²θ = 1" },
      { name: "tan θ", formula: "tan θ = sin θ / cos θ" },
      { name: "Area of Triangle", formula: "A = ½ ab sin C" },
    ],
    "Geometry": [
      { name: "Surface Area of Sphere", formula: "SA = 4πr²" },
      { name: "Volume of Cone", formula: "V = ⅓πr²h" },
      { name: "CSA of Cylinder", formula: "CSA = 2πrh" },
    ]
  },
  "11": {
    "Algebra": [
      { name: "Binomial Theorem", formula: "(a+b)ⁿ = Σ C(n,r) aⁿ⁻ʳ bʳ" },
      { name: "Permutations", formula: "P(n,r) = n!/(n-r)!" },
      { name: "Combinations", formula: "C(n,r) = n!/r!(n-r)!" },
    ],
    "Trigonometry": [
      { name: "sin(A+B)", formula: "sin(A+B) = sinA cosB + cosA sinB" },
      { name: "cos(A+B)", formula: "cos(A+B) = cosA cosB - sinA sinB" },
      { name: "Law of Cosines", formula: "c² = a² + b² - 2ab cos C" },
    ],
    "Calculus": [
      { name: "Limits Definition", formula: "lim(x→a) f(x) = L" },
      { name: "Derivative Power Rule", formula: "d/dx(xⁿ) = nxⁿ⁻¹" },
    ]
  },
  "12": {
    "Calculus": [
      { name: "Integration Power Rule", formula: "∫xⁿ dx = xⁿ⁺¹/(n+1) + C" },
      { name: "Chain Rule", formula: "d/dx[f(g(x))] = f'(g(x))·g'(x)" },
      { name: "Integration by Parts", formula: "∫u dv = uv - ∫v du" },
      { name: "Definite Integral", formula: "∫ₐᵇ f(x)dx = F(b) - F(a)" },
    ],
    "Algebra": [
      { name: "Matrix Determinant 2x2", formula: "|A| = ad - bc" },
      { name: "Inverse Matrix", formula: "A⁻¹ = adj(A)/|A|" },
    ],
    "Probability": [
      { name: "Bayes Theorem", formula: "P(A|B) = P(B|A)P(A)/P(B)" },
      { name: "Mean of Distribution", formula: "μ = Σ xᵢP(xᵢ)" },
    ]
  },
  "JEE": {
    "Mathematics": [
      { name: "Quadratic Formula", formula: "x = (-b ± √(b²-4ac)) / 2a" },
      { name: "Binomial Theorem", formula: "(1+x)ⁿ = Σ C(n,r) xʳ" },
      { name: "Integration by Parts", formula: "∫u dv = uv - ∫v du" },
      { name: "Taylor Series", formula: "f(x) = Σ f⁽ⁿ⁾(a)(x-a)ⁿ/n!" },
    ],
    "Physics": [
      { name: "Newton's Second Law", formula: "F = ma" },
      { name: "Kinetic Energy", formula: "KE = ½mv²" },
      { name: "Wave Equation", formula: "v = fλ" },
      { name: "Coulomb's Law", formula: "F = kq₁q₂/r²" },
    ],
    "Chemistry": [
      { name: "Ideal Gas Law", formula: "PV = nRT" },
      { name: "Molarity", formula: "M = moles/volume(L)" },
      { name: "pH Formula", formula: "pH = -log[H⁺]" },
      { name: "Nernst Equation", formula: "E = E° - (RT/nF)lnQ" },
    ]
  }
}

// ============================================
// FEEDBACK STORE
// ============================================
const feedbackStore: { question: string, rating: string, solution: string, confidence: number, timestamp: number }[] = []

// ============================================
// AI HELPER
// ============================================
async function callAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) throw new Error('LOVABLE_API_KEY not set')

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`AI error: ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// ============================================
// STEP COUNT BY LEVEL
// ============================================
function getStepRange(level: string): { min: number, max: number } {
  switch (level) {
    case 'easy': return { min: 5, max: 8 }
    case 'medium': return { min: 3, max: 5 }
    case 'hard': return { min: 2, max: 4 }
    default: return { min: 3, max: 5 }
  }
}

function getLevelDescription(level: string): string {
  switch (level) {
    case 'easy': return 'Basic conceptual problems with very detailed explanation and direct formula usage'
    case 'medium': return 'Standard board-level questions with structured step-by-step explanation'
    case 'hard': return 'Multi-step reasoning with higher-order thinking, logical reasoning emphasized, concise steps'
    default: return 'Standard explanation'
  }
}

// ============================================
// ASSESSMENT QUESTIONS
// ============================================
function getAssessmentQuestions(board: string, classLevel: number): { question: string, difficulty: string, expectedAnswer: string }[] {
  // Generate contextual assessment questions based on board/class
  const questions = [
    {
      difficulty: 'easy',
      question: classLevel <= 10
        ? 'Solve: 3x + 7 = 22. What is x?'
        : 'Find the derivative of f(x) = 3x² + 2x',
      expectedAnswer: classLevel <= 10 ? '5' : '6x + 2',
    },
    {
      difficulty: 'medium',
      question: classLevel <= 10
        ? 'Solve the quadratic equation: x² - 5x + 6 = 0'
        : 'Find the integral of (2x + 3) dx',
      expectedAnswer: classLevel <= 10 ? 'x = 2 or x = 3' : 'x² + 3x + C',
    },
    {
      difficulty: 'hard',
      question: classLevel <= 10
        ? 'The sum of three consecutive even numbers is 78. Find the numbers.'
        : 'Find the limit: lim(x→0) (sin(3x))/(2x)',
      expectedAnswer: classLevel <= 10 ? '24, 26, 28' : '3/2',
    },
  ]
  return questions
}

// ============================================
// SOLVE HANDLER
// ============================================
async function handleSolve(req: Request): Promise<Response> {
  const body = await req.json()
  const { question, board, class_level } = body

  // Session management via a simple header or generate one
  const sessionId = req.headers.get('x-session-id') || 'default-session'
  const session = getSession(sessionId)

  // Check if this is an assessment phase
  if (!session.assessment_completed) {
    // If no assessment questions given yet, return the first assessment question
    if (session.assessment_questions_given === 0) {
      const assessmentQs = getAssessmentQuestions(board, class_level || 10)
      session.assessment_questions_given = 1

      // Check if the user's "question" is actually an attempt to answer an assessment
      // First time: give them the assessment questions
      const assessmentSteps = [
        `📊 Your Current Level: ASSESSMENT IN PROGRESS`,
        `Welcome! Before we begin, I need to assess your current level.`,
        `Please solve the following 3 problems and send your answers one by one.`,
        `Problem 1 (Easy): ${assessmentQs[0].question}`,
        `Problem 2 (Medium): ${assessmentQs[1].question}`,
        `Problem 3 (Hard): ${assessmentQs[2].question}`,
        `Type your answer to Problem 1 first!`,
      ]

      return new Response(JSON.stringify({
        question: 'Level Assessment',
        steps: assessmentSteps,
        solution: 'Please answer the 3 assessment problems to determine your starting level.',
        confidence: 1.0,
        source: 'knowledge_base',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Process assessment answers
    const assessmentQs = getAssessmentQuestions(board, class_level || 10)
    const currentQ = session.assessment_questions_given - 1 // 0-indexed

    if (currentQ < 3) {
      // Use AI to check if the answer is correct
      const checkPrompt = `The student was asked: "${assessmentQs[currentQ].question}"
The expected answer is: "${assessmentQs[currentQ].expectedAnswer}"
The student answered: "${question}"
Is the student's answer correct or essentially correct? Reply with only "CORRECT" or "INCORRECT".`

      let isCorrect = false
      try {
        const aiResult = await callAI(checkPrompt)
        isCorrect = aiResult.trim().toUpperCase().includes('CORRECT') && !aiResult.trim().toUpperCase().includes('INCORRECT')
      } catch {
        // If AI fails, do basic string matching
        isCorrect = question.toLowerCase().includes(assessmentQs[currentQ].expectedAnswer.toLowerCase())
      }

      session.assessment_answers.push({ difficulty: assessmentQs[currentQ].difficulty, correct: isCorrect })
      session.assessment_questions_given++

      if (session.assessment_questions_given <= 3) {
        // More assessment questions to go
        const nextQ = session.assessment_questions_given - 1
        const resultEmoji = isCorrect ? '✅ Correct!' : '❌ Not quite.'
        return new Response(JSON.stringify({
          question: `Assessment - Problem ${currentQ + 1} Result`,
          steps: [
            `📊 Your Current Level: ASSESSMENT IN PROGRESS`,
            `${resultEmoji} Your answer to Problem ${currentQ + 1} has been recorded.`,
            `Now solve Problem ${nextQ + 1} (${assessmentQs[nextQ].difficulty}): ${assessmentQs[nextQ].question}`,
          ],
          solution: `Answer Problem ${nextQ + 1} to continue the assessment.`,
          confidence: 1.0,
          source: 'knowledge_base',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // All 3 answered - determine level
      const resultEmoji = isCorrect ? '✅ Correct!' : '❌ Not quite.'
      const easyCorrect = session.assessment_answers.find(a => a.difficulty === 'easy')?.correct || false
      const mediumCorrect = session.assessment_answers.find(a => a.difficulty === 'medium')?.correct || false
      const hardCorrect = session.assessment_answers.find(a => a.difficulty === 'hard')?.correct || false

      if (hardCorrect && mediumCorrect && easyCorrect) {
        session.current_level = 'hard'
      } else if (easyCorrect && mediumCorrect) {
        session.current_level = 'medium'
      } else if (easyCorrect) {
        session.current_level = 'easy'
      } else {
        session.current_level = 'easy'
      }

      session.assessment_completed = true
      session.correct_streak = 0
      session.wrong_streak = 0

      return new Response(JSON.stringify({
        question: 'Assessment Complete!',
        steps: [
          `📊 Your Current Level: ${session.current_level.toUpperCase()}`,
          `${resultEmoji} Your answer to Problem ${currentQ + 1} has been recorded.`,
          `Assessment Results:`,
          `Easy: ${easyCorrect ? '✅ Correct' : '❌ Incorrect'}`,
          `Medium: ${mediumCorrect ? '✅ Correct' : '❌ Incorrect'}`,
          `Hard: ${hardCorrect ? '✅ Correct' : '❌ Incorrect'}`,
          `Your starting difficulty has been set to ${session.current_level.toUpperCase()}.`,
          `You can now ask any math question! I will adapt to your level.`,
        ],
        solution: `Starting level: ${session.current_level.toUpperCase()}. Ask your first question!`,
        confidence: 1.0,
        source: 'knowledge_base',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  }

  // ============================================
  // ADAPTIVE SOLVING (post-assessment)
  // ============================================
  const level = session.current_level
  const stepRange = getStepRange(level)
  const levelDesc = getLevelDescription(level)

  const prompt = `You are an expert Math Tutor AI. Solve the following problem.

Board: ${board}
Class Level: ${class_level}
Current Difficulty Level: ${level.toUpperCase()}
Step Range: Provide between ${stepRange.min} and ${stepRange.max} steps.

Level behavior: ${levelDesc}

Problem: ${question}

IMPORTANT RULES:
- No markdown formatting, no HTML, no special characters for formatting
- Clean plain text only
- Academic and friendly tone
- Use the board and class level context to tailor the explanation
- Provide exactly the right number of steps for the difficulty level
- After the solution, ask: "Would you like a more detailed explanation for this problem?"

Respond in this exact JSON format (no markdown code blocks):
{
  "steps": ["step 1 text", "step 2 text", ...],
  "solution": "final answer here",
  "confidence": 0.XX
}

The confidence should be between 0.7 and 0.98. Use lower confidence if the problem is ambiguous.`

  try {
    const aiResponse = await callAI(prompt)

    // Parse AI response
    let parsed: { steps: string[], solution: string, confidence: number }
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch {
      // Fallback if parsing fails
      parsed = {
        steps: [aiResponse],
        solution: aiResponse.substring(0, 200),
        confidence: 0.75,
      }
    }

    // Ensure step count is within range
    while (parsed.steps.length < stepRange.min) {
      parsed.steps.push('Verify the result by substituting back into the original equation.')
    }
    if (parsed.steps.length > stepRange.max) {
      parsed.steps = parsed.steps.slice(0, stepRange.max)
    }

    // Ensure confidence is in range
    parsed.confidence = Math.max(0.7, Math.min(0.98, parsed.confidence || 0.85))

    // Update session - check if answer seems correct (simplified: we assume AI gives correct answers)
    // In a real system, you'd verify the student's answer against the AI solution
    session.total_questions++
    session.correct_streak++
    session.wrong_streak = 0

    // Adaptive difficulty adjustment
    if (session.correct_streak >= 2) {
      if (session.current_level === 'easy') session.current_level = 'medium'
      else if (session.current_level === 'medium') session.current_level = 'hard'
      session.correct_streak = 0
    }

    // Add level info as first step
    const stepsWithLevel = [
      `📊 Your Current Level: ${level.toUpperCase()}`,
      ...parsed.steps,
      `Would you like a more detailed explanation for this problem?`,
    ]

    return new Response(JSON.stringify({
      question,
      steps: stepsWithLevel,
      solution: parsed.solution,
      confidence: parsed.confidence,
      source: 'ai_generated' as const,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Solve error:', error)
    return new Response(JSON.stringify({
      question,
      steps: [
        `📊 Your Current Level: ${level.toUpperCase()}`,
        'Sorry, I encountered an error processing your question.',
        'Please try again with a clearer math problem.',
      ],
      solution: 'Error processing question. Please try again.',
      confidence: 0.7,
      source: 'ai_generated' as const,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  }
}

// ============================================
// FORMULAS HANDLER
// ============================================
function handleFormulas(url: URL): Response {
  // Extract class level from path: /api/formulas/10 or /api/formulas/JEE
  const pathParts = url.pathname.split('/')
  const classLevel = pathParts[pathParts.length - 1] || '10'

  const formulas = formulasData[classLevel]
  if (!formulas) {
    return new Response(JSON.stringify({
      error: `No formulas found for class/level: ${classLevel}`,
      formulas: {},
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({
    class_level: classLevel,
    formulas,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// ============================================
// FEEDBACK HANDLER
// ============================================
function handleFeedback(url: URL): Response {
  const question = url.searchParams.get('question') || ''
  const rating = url.searchParams.get('rating') || ''
  const solution = url.searchParams.get('solution') || ''
  const confidence = parseFloat(url.searchParams.get('confidence') || '0')

  feedbackStore.push({ question, rating, solution, confidence, timestamp: Date.now() })

  return new Response(JSON.stringify({
    success: true,
    message: 'Feedback recorded successfully',
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// ============================================
// MAIN ROUTER
// ============================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  try {
    // Route: /assess - GET to start assessment on page load
    if (path.endsWith('/assess') && req.method === 'GET') {
      const board = url.searchParams.get('board') || 'CBSE'
      const classLevel = parseInt(url.searchParams.get('class_level') || '10')
      const sessionId = req.headers.get('x-session-id') || url.searchParams.get('session_id') || 'default-session'
      const session = getSession(sessionId)

      if (session.assessment_completed) {
        return new Response(JSON.stringify({
          assessment_completed: true,
          current_level: session.current_level,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const assessmentQs = getAssessmentQuestions(board, classLevel)
      if (session.assessment_questions_given === 0) {
        session.assessment_questions_given = 1
      }

      return new Response(JSON.stringify({
        assessment_completed: false,
        question: 'Level Assessment',
        steps: [
          '📊 Your Current Level: ASSESSMENT IN PROGRESS',
          'Welcome! Before we begin, I need to assess your current level.',
          'Please solve the following 3 problems and send your answers one by one.',
          `Problem 1 (Easy): ${assessmentQs[0].question}`,
          `Problem 2 (Medium): ${assessmentQs[1].question}`,
          `Problem 3 (Hard): ${assessmentQs[2].question}`,
          'Type your answer to Problem 1 in the question box and click Solve!',
        ],
        solution: 'Please answer the 3 assessment problems to determine your starting level.',
        confidence: 1.0,
        source: 'knowledge_base',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Route: /solve or ends with /solve
    if (path.endsWith('/solve') && req.method === 'POST') {
      return await handleSolve(req)
    }

    // Route: /formulas/... 
    if (path.includes('/formulas')) {
      return handleFormulas(url)
    }

    // Route: /feedback
    if (path.includes('/feedback') && req.method === 'POST') {
      return handleFeedback(url)
    }

    return new Response(JSON.stringify({ error: 'Not found', path }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Router error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
