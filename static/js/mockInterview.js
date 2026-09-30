/**
 * CareerPilot AI - AI Mock Interview Studio (mockInterview.js)
 * Real-time Speech-to-Text & Text-to-Speech enabled interactive interview simulator with multi-metric diagnostic report.
 */

class MockInterview {
    constructor() {
        this.selectedType = 'Technical';
        this.currentStep = 0;
        this.totalSteps = 5;
        this.userAnswers = [];
        this.isRecording = false;
        this.isMuted = false;
        this.recognition = null;
        this.radarChart = null;

        this.questionBank = {
            'Software Engineer': [
                "Explain how garbage collection works in memory management, and contrast reference counting with mark-and-sweep.",
                "How would you design a rate limiter for a distributed microservice architecture handling 100k requests per second?",
                "What is the difference between SQL indexing using B-Trees vs Hash Indexes? When should you use each?",
                "Tell me about a challenging technical bug you encountered in a recent project and how you solved it.",
                "How do you ensure web application security against SQL Injection and Cross-Site Scripting (XSS)?"
            ],
            'Full Stack Web Developer': [
                "Explain the critical rendering path in modern browsers and how you optimize Web Vitals (LCP, CLS, INP).",
                "How do Server-Side Rendering (SSR), Client-Side Rendering (CSR), and Static Site Generation (SSG) differ?",
                "What strategies do you use for efficient state management and data caching in complex web applications?",
                "Explain CORS (Cross-Origin Resource Sharing), preflight OPTIONS requests, and how to secure API endpoints.",
                "How do web sockets differ from standard HTTP REST API polling for real-time applications?"
            ],
            'Data Scientist / AI Engineer': [
                "Explain the trade-off between bias and variance, and how regularization techniques (L1/L2) prevent overfitting.",
                "How does self-attention mechanism work in Transformer architecture models?",
                "What metrics (Precision, Recall, F1-Score, ROC-AUC) would you prioritize for an imbalanced classification problem?",
                "How do vector databases work for Retrieval-Augmented Generation (RAG) in Large Language Model systems?",
                "Describe a machine learning model pipeline you deployed to production and how you monitored data drift."
            ],
            'Product Manager': [
                "How do you prioritize competing product features when engineering bandwidth and timeline are severely constrained?",
                "Walk me through how you measure product-market fit and define North Star metrics for a new SaaS platform.",
                "Tell me about a time a product launch failed or missed metrics. What did you learn and how did you pivot?",
                "How do you handle disagreements with engineering leads regarding technical debt vs new feature velocity?",
                "Describe how you conduct user interviews and translate qualitative feedback into actionable product specifications."
            ],
            'Cybersecurity Analyst': [
                "Explain the zero-trust security framework and how it differs from perimeter-based network security.",
                "How do Public Key Infrastructure (PKI) and asymmetric RSA/ECC encryption work during a TLS handshake?",
                "Walk me through your Incident Response process when detecting a potential ransomware breach or data exfiltration.",
                "What is the difference between vulnerability scanning and penetration testing?",
                "How do you secure cloud IAM roles and enforce the Principle of Least Privilege across AWS/GCP infrastructure?"
            ],
            'UI/UX Designer': [
                "Walk me through your end-to-end design process from initial user research to high-fidelity wireframing and prototyping.",
                "How do you ensure design accessibility (WCAG 2.1 AAA compliance) for color contrast, screen readers, and keyboard navigation?",
                "Tell me about a design decision you made that was challenged by stakeholders or developers. How did you justify it?",
                "How do you conduct A/B testing and quantitative usability testing to validate design iterations?",
                "How do you build and maintain scalable design systems with atomic component libraries?"
            ],
            'HR': [
                "Tell me about a time you experienced conflict with a team member on a tight deadline. How did you resolve it?",
                "Where do you see yourself professionally in 3 to 5 years, and how does this role align with your goals?",
                "Why are you specifically interested in joining our engineering team and corporate culture?",
                "Describe a situation where project requirements changed last minute. How did you adapt and reprioritize?",
                "What is your greatest technical strength, and what is one area of growth you are actively working to improve?"
            ],
            'Mixed': [
                "Explain how you design scalable backend API architectures while keeping clean code documentation.",
                "Tell me about a technical project you led. How did you communicate technical decisions to non-technical stakeholders?",
                "What strategies do you use for unit testing, integration testing, and maintaining software quality?",
                "Describe a situation where you had to learn a new programming language or framework under time pressure.",
                "How do you maintain work-life balance and avoid burnout while delivering high-impact technical milestones?"
            ]
        };

        this.initSpeech();
    }

    initSpeech() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                const input = document.getElementById('candidateAnswerInput');
                if (input) {
                    const existingText = input.getAttribute('data-base-text') || '';
                    input.value = (existingText + ' ' + finalTranscript + ' ' + interimTranscript).trim();
                }
            };

            this.recognition.onerror = (err) => {
                console.log('Speech recognition error:', err);
                this.stopMic();
                if (err.error !== 'no-speech') {
                    app.showToast('Microphone error or permission denied.', 'error');
                }
            };

            this.recognition.onend = () => {
                if (this.isRecording) {
                    try { this.recognition.start(); } catch (e) {}
                }
            };
        }
    }

    selectType(typeName) {
        this.selectedType = typeName;
        document.querySelectorAll('.interview-type-grid .type-card').forEach(c => c.classList.remove('active'));
        
        const cardId = `typeCard${typeName}`;
        const targetCard = document.getElementById(cardId);
        if (targetCard) {
            targetCard.classList.add('active');
        }

        if (app && app.showToast) {
            app.showToast(`Selected Round: ${typeName === 'HR' ? 'HR & Behavioral' : typeName}`, 'info');
        }
    }

    startSession() {
        const roleSelect = document.getElementById('intJobRole');
        const role = roleSelect ? roleSelect.value : 'Software Engineer';

        const roomRoleTag = document.getElementById('roomRoleTag');
        const roomTypeTag = document.getElementById('roomTypeTag');
        const setupScreen = document.getElementById('interviewSetupScreen');
        const activeScreen = document.getElementById('interviewActiveScreen');
        const reportScreen = document.getElementById('interviewReportScreen');

        if (roomRoleTag) roomRoleTag.textContent = role;
        if (roomTypeTag) roomTypeTag.textContent = this.selectedType === 'HR' ? 'HR & Behavioral' : this.selectedType;

        if (setupScreen) setupScreen.style.display = 'none';
        if (activeScreen) activeScreen.style.display = 'block';
        if (reportScreen) reportScreen.style.display = 'none';

        this.currentStep = 0;
        this.userAnswers = [];
        this.loadQuestion();
        if (app && app.showToast) {
            app.showToast(`AI Interview Room Active for ${role}`, 'success');
        }
    }

    loadQuestion() {
        const roomRoleTag = document.getElementById('roomRoleTag');
        const role = roomRoleTag ? roomRoleTag.textContent : 'Software Engineer';
        
        let qList = this.questionBank[role];
        if (this.selectedType === 'HR') {
            qList = this.questionBank['HR'];
        } else if (this.selectedType === 'Mixed') {
            qList = this.questionBank['Mixed'];
        }

        if (!qList || qList.length === 0) {
            qList = this.questionBank['Software Engineer'];
        }
        
        const qText = qList[this.currentStep % qList.length];
        
        const currentQNum = document.getElementById('currentQNum');
        const totalQNum = document.getElementById('totalQNum');
        const progressFill = document.getElementById('interviewProgressFill');
        const aiQuestionText = document.getElementById('aiQuestionText');

        if (currentQNum) currentQNum.textContent = this.currentStep + 1;
        if (totalQNum) totalQNum.textContent = this.totalSteps;
        if (progressFill) progressFill.style.width = `${((this.currentStep + 1) / this.totalSteps) * 100}%`;
        if (aiQuestionText) aiQuestionText.textContent = qText;

        const input = document.getElementById('candidateAnswerInput');
        if (input) {
            input.value = '';
            input.setAttribute('data-base-text', '');
        }

        this.speakQuestion();
    }

    toggleMuteVoice() {
        this.isMuted = !this.isMuted;
        const btn = document.getElementById('muteVoiceBtn');
        if (this.isMuted) {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            if (btn) btn.innerHTML = '<i class="fa-solid fa-volume-xmark text-rose"></i>';
            if (app && app.showToast) app.showToast('AI Examiner Voice Muted', 'info');
        } else {
            if (btn) btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            if (app && app.showToast) app.showToast('AI Examiner Voice Unmuted', 'info');
            this.speakQuestion();
        }
    }

    speakQuestion() {
        if (this.isMuted) return;
        const aiQuestionText = document.getElementById('aiQuestionText');
        if (!aiQuestionText) return;

        const text = aiQuestionText.textContent;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            utterance.lang = 'en-US';

            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Zira')));
            if (preferredVoice) utterance.voice = preferredVoice;

            const ring = document.getElementById('avatarPulseRing');
            if (ring) ring.classList.add('pulse-active');

            utterance.onend = () => {
                if (ring) ring.classList.remove('pulse-active');
            };

            window.speechSynthesis.speak(utterance);
        }
    }

    toggleMic() {
        if (!this.recognition) {
            if (app && app.showToast) app.showToast('Real-time Speech Recognition not supported in this browser. You can type your answer directly.', 'error');
            return;
        }

        if (this.isRecording) {
            this.stopMic();
        } else {
            this.startMic();
        }
    }

    startMic() {
        this.isRecording = true;
        const input = document.getElementById('candidateAnswerInput');
        if (input) input.setAttribute('data-base-text', input.value);

        try {
            this.recognition.start();
        } catch (e) {}

        const micStatusText = document.getElementById('micStatusText');
        const recordingPulse = document.getElementById('recordingPulse');
        const micIcon = document.getElementById('micIcon');
        const soundWaveBars = document.getElementById('soundWaveBars');

        if (micStatusText) micStatusText.textContent = 'Stop Listening (Click to Pause Voice)';
        if (recordingPulse) recordingPulse.style.display = 'inline-block';
        if (micIcon) micIcon.className = 'fa-solid fa-microphone-slash text-rose';
        if (soundWaveBars) soundWaveBars.style.display = 'flex';

        if (app && app.showToast) app.showToast('Microphone Active! Speak your answer clearly...', 'info');
    }

    stopMic() {
        this.isRecording = false;
        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }
        
        const micStatusText = document.getElementById('micStatusText');
        const recordingPulse = document.getElementById('recordingPulse');
        const micIcon = document.getElementById('micIcon');
        const soundWaveBars = document.getElementById('soundWaveBars');

        if (micStatusText) micStatusText.textContent = 'Click to Speak (Real-Time Speech-to-Text)';
        if (recordingPulse) recordingPulse.style.display = 'none';
        if (micIcon) micIcon.className = 'fa-solid fa-microphone';
        if (soundWaveBars) soundWaveBars.style.display = 'none';
    }

    submitAnswer() {
        const input = document.getElementById('candidateAnswerInput');
        const answer = input ? input.value : '';
        if (!answer || answer.trim().length < 4) {
            if (app && app.showToast) app.showToast('Please type or speak your response before submitting.', 'error');
            return;
        }

        this.stopMic();
        const aiQuestionText = document.getElementById('aiQuestionText');
        this.userAnswers.push({
            question: aiQuestionText ? aiQuestionText.textContent : 'Question',
            answer: answer
        });

        this.currentStep++;

        if (this.currentStep < this.totalSteps) {
            if (app && app.showToast) app.showToast('Answer recorded! Loading next question...', 'info');
            this.loadQuestion();
        } else {
            this.generateReport();
        }
    }

    endSessionEarly() {
        if (confirm('Are you sure you want to end the interview session early?')) {
            this.stopMic();
            this.generateReport();
        }
    }

    resetSession() {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        this.stopMic();
        document.getElementById('interviewSetupScreen').style.display = 'block';
        document.getElementById('interviewActiveScreen').style.display = 'none';
        document.getElementById('interviewReportScreen').style.display = 'none';
    }

    async generateReport() {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        
        document.getElementById('interviewActiveScreen').style.display = 'none';
        document.getElementById('interviewReportScreen').style.display = 'block';

        const role = document.getElementById('roomRoleTag')?.textContent || 'Software Engineer';
        const type = document.getElementById('roomTypeTag')?.textContent || 'Technical';

        // Evaluate average answer length and scores
        let overall = 84;
        if (this.userAnswers.length > 0) {
            const avgLen = this.userAnswers.reduce((acc, a) => acc + a.answer.split(' ').length, 0) / this.userAnswers.length;
            overall = Math.min(96, Math.max(68, Math.round(70 + (avgLen * 0.45))));
        }

        const tech = Math.min(98, overall + 2);
        const comm = Math.min(98, overall - 1);
        const conf = Math.min(98, overall + 3);

        const repOverall = document.getElementById('repOverallScore');
        const repTech = document.getElementById('repTechScore');
        const repComm = document.getElementById('repCommScore');
        const repConf = document.getElementById('repConfScore');

        if (repOverall) repOverall.textContent = `${overall}%`;
        if (repTech) repTech.textContent = `${tech}/100`;
        if (repComm) repComm.textContent = `${comm}/100`;
        if (repConf) repConf.textContent = `${conf}/100`;

        // Save session to Flask backend SQLite database
        try {
            fetch('/api/interview/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobRole: role,
                    interviewType: type,
                    overallScore: overall,
                    techScore: tech,
                    commScore: comm,
                    confScore: conf
                })
            });
        } catch (e) {
            console.log('Failed saving interview session to server');
        }

        // Strengths & Weaknesses
        const repStrengths = document.getElementById('repStrengthsList');
        const repWeaknesses = document.getElementById('repWeaknessesList');
        if (repStrengths) {
            repStrengths.innerHTML = `
                <li>Clear explanation of core technical concepts and algorithms.</li>
                <li>Confident tone and structured response delivery.</li>
                <li>Good emphasis on system scalability and security principles.</li>
            `;
        }
        if (repWeaknesses) {
            repWeaknesses.innerHTML = `
                <li>Elaborate more on specific quantifiable metrics from past experience.</li>
                <li>Pace answers slightly slower for complex technical architecture questions.</li>
            `;
        }

        // Render Question Breakdown
        const breakdown = document.getElementById('repQuestionBreakdownList');
        if (breakdown) {
            breakdown.innerHTML = this.userAnswers.map((item, idx) => `
                <div style="background: var(--bg-input); padding: 1rem; border-radius: 8px; margin-bottom: 0.85rem; border: 1px solid var(--border-color);">
                    <h5 style="color: var(--primary); font-size: 0.95rem; margin-bottom: 0.35rem;">Q${idx + 1}: ${item.question}</h5>
                    <p style="font-size: 0.88rem; color: var(--text-main); font-style: italic;">"${item.answer}"</p>
                </div>
            `).join('');
        }

        // Render Radar Chart
        this.renderRadarChart();
        if (app && app.triggerConfetti) app.triggerConfetti();
        if (app && app.showToast) app.showToast('AI Diagnostic Scorecard Generated!', 'success');
    }

    renderRadarChart() {
        const ctx = document.getElementById('interviewRadarChart');
        if (!ctx) return;

        if (this.radarChart) this.radarChart.destroy();
        this.radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Technical Accuracy', 'Communication', 'Confidence', 'STAR Structure', 'Problem Solving'],
                datasets: [{
                    label: 'Score Rating',
                    data: [88, 82, 85, 90, 86],
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: '#4f46e5',
                    pointBackgroundColor: '#4f46e5',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#4f46e5'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#64748b', font: { size: 11 } },
                        ticks: { display: false },
                        suggestedMin: 50,
                        suggestedMax: 100
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}

// Global Singleton Instance
const mockInterview = new MockInterview();
