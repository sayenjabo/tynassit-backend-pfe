const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { protect, companyOnly, deviceOnly } = require('../middleware/auth.middleware');

// ─── Routes casque Quest (deviceOnly) ────────────────────────────────────────

// Récupérer le quiz d'une formation — sans correctIndex
router.get('/trainings/:trainingId/quiz', deviceOnly, quizController.getQuizForDevice);

// Soumettre les réponses — retourne score + résultats
router.post('/quiz/submit', deviceOnly, quizController.submitQuiz);

// ─── Routes dashboard company (companyOnly) ───────────────────────────────────

router.use(protect, companyOnly);

// Créer le quiz d'une formation
router.post('/trainings/:trainingId/quiz', quizController.createQuiz);

// Voir le quiz (avec correctIndex) pour édition
router.get('/trainings/:trainingId/quiz/edit', quizController.getQuizForCompany);

// Modifier le quiz
router.patch('/trainings/:trainingId/quiz', quizController.updateQuiz);

// Supprimer le quiz
router.delete('/trainings/:trainingId/quiz', quizController.deleteQuiz);

module.exports = router;
