const Quiz = require('../models/quiz');

// ─── GET quiz pour le casque — sans correctIndex ──────────────────────────────
// protégé par deviceOnly

exports.getQuizForDevice = async (req, res) => {
  try {
    const { trainingId } = req.params;
    const companyId = req.user.id; // extrait du token casque

    const quiz = await Quiz.findOne({
      training: trainingId,
      company: companyId,
      isActive: true,
    });

    if (!quiz) {
      return res.status(404).json({ message: 'No quiz found for this training' });
    }

    // Retirer correctIndex de chaque question avant d'envoyer au casque
    const safeQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      text: q.text,
      choices: q.choices.map((c) => ({ _id: c._id, text: c.text })),
      // correctIndex intentionnellement absent
    }));

    res.json({
      quizId: quiz._id,
      passingScore: quiz.passingScore,
      questions: safeQuestions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── POST submit quiz — valide les réponses et retourne le score ──────────────
// protégé par deviceOnly
// Body : { quizId, answers: [{ questionId, selectedIndex }] }

exports.submitQuiz = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { quizId, answers } = req.body;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'quizId and answers array are required' });
    }

    // Récupérer le quiz AVEC correctIndex cette fois
    const quiz = await Quiz.findOne({ _id: quizId, company: companyId, isActive: true });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Valider chaque réponse
    let correctCount = 0;
    const results = quiz.questions.map((question) => {
      const answer = answers.find((a) => a.questionId === question._id.toString());
      const isCorrect = answer !== undefined && answer.selectedIndex === question.correctIndex;
      if (isCorrect) correctCount++;

      return {
        questionId: question._id,
        correct: isCorrect,
        correctIndex: question.correctIndex, // retourné APRÈS soumission pour affichage feedback
      };
    });

    const totalQuestions = quiz.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= quiz.passingScore;

    res.json({
      score,
      passed,
      correctCount,
      totalQuestions,
      passingScore: quiz.passingScore,
      results, // Unity peut afficher les bonnes réponses dans l'écran de résultat
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── CRUD quiz — dashboard company ───────────────────────────────────────────

// Créer un quiz pour une formation
exports.createQuiz = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { trainingId, questions, passingScore } = req.body;

    if (!trainingId || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'trainingId and questions are required' });
    }

    // Vérifier qu'un quiz n'existe pas déjà pour cette formation
    const existing = await Quiz.findOne({ training: trainingId, company: companyId });
    if (existing) {
      return res.status(409).json({ message: 'A quiz already exists for this training — use PATCH to update it' });
    }

    const quiz = await Quiz.create({
      training: trainingId,
      company: companyId,
      questions,
      passingScore: passingScore || 70,
    });

    res.status(201).json({ message: 'Quiz created successfully', quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer le quiz d'une formation (dashboard company — avec correctIndex)
exports.getQuizForCompany = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { trainingId } = req.params;

    const quiz = await Quiz.findOne({ training: trainingId, company: companyId });
    if (!quiz) {
      return res.status(404).json({ message: 'No quiz found for this training' });
    }

    res.json({ quiz }); // correctIndex inclus pour l'édition
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour le quiz
exports.updateQuiz = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { trainingId } = req.params;
    const { questions, passingScore, isActive } = req.body;

    const quiz = await Quiz.findOne({ training: trainingId, company: companyId });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (questions !== undefined) quiz.questions = questions;
    if (passingScore !== undefined) quiz.passingScore = passingScore;
    if (isActive !== undefined) quiz.isActive = isActive;

    await quiz.save();
    res.json({ message: 'Quiz updated successfully', quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer le quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { trainingId } = req.params;

    const quiz = await Quiz.findOneAndDelete({ training: trainingId, company: companyId });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
