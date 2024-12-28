import React, { useState, useEffect } from 'react';
import { WORDS, getRandomWord } from './utils/words';
import confetti from 'canvas-confetti';
import './App.css';

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

function App() {
    const [solution, setSolution] = useState('');
    const [guesses, setGuesses] = useState(Array(MAX_ATTEMPTS).fill(null));
    const [currentGuess, setCurrentGuess] = useState('');
    const [gameStatus, setGameStatus] = useState('playing');
    const [shake, setShake] = useState(false);
    const [guessedLetters, setGuessedLetters] = useState({
        correct: new Set(),
        present: new Set(),
        absent: new Set()
    });
    const [revealedTiles, setRevealedTiles] = useState(
        Array(MAX_ATTEMPTS).fill().map(() => Array(WORD_LENGTH).fill(false))
    );

    const triggerConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti(Object.assign({}, defaults, { 
                particleCount, 
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#6a5acd', '#6aaa64', '#c9b458']  // Bible Wordle theme colors
            }));
            confetti(Object.assign({}, defaults, { 
                particleCount, 
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#6a5acd', '#6aaa64', '#c9b458']  // Bible Wordle theme colors
            }));
        }, 250);
    };

    const resetGame = () => {
        const word = getRandomWord();
        setSolution(word);
        setGuesses(Array(MAX_ATTEMPTS).fill(null));
        setCurrentGuess('');
        setGameStatus('playing');
        setGuessedLetters({
            correct: new Set(),
            present: new Set(),
            absent: new Set()
        });
        setRevealedTiles(
            Array(MAX_ATTEMPTS).fill().map(() => Array(WORD_LENGTH).fill(false))
        );
    };

    useEffect(() => {
        resetGame();
    }, []);

    const handleKeyPress = (key) => {
        if (gameStatus !== 'playing') return;

        key = key.toUpperCase();

        if (key === 'ENTER' && currentGuess.length === WORD_LENGTH) {
            if (!WORDS.includes(currentGuess)) {
                setShake(true);
                setTimeout(() => setShake(false), 500);
                return;
            }

            const newGuesses = [...guesses];
            const currentAttemptIndex = newGuesses.findIndex(val => val == null);
            
            newGuesses[currentAttemptIndex] = currentGuess;
            setGuesses(newGuesses);

            // Reveal tiles with a staggered animation
            const letterStatus = checkGuess(currentGuess, solution);
            const newRevealedTiles = [...revealedTiles];
            
            currentGuess.split('').forEach((_, index) => {
                setTimeout(() => {
                    setRevealedTiles(prev => {
                        const updated = [...prev];
                        updated[currentAttemptIndex][index] = true;
                        return updated;
                    });
                }, index * 250);
            });

            // Update guessed letters
            const updatedGuessedLetters = {...guessedLetters};

            currentGuess.split('').forEach((char, index) => {
                if (letterStatus[index] === 'correct') {
                    updatedGuessedLetters.correct.add(char);
                } else if (letterStatus[index] === 'present') {
                    updatedGuessedLetters.present.add(char);
                } else {
                    updatedGuessedLetters.absent.add(char);
                }
            });

            setGuessedLetters(updatedGuessedLetters);

            if (currentGuess === solution) {
                setGameStatus('won');
                // Trigger confetti when game is won
                setTimeout(triggerConfetti, 1000);
            } else if (currentAttemptIndex === MAX_ATTEMPTS - 1) {
                setGameStatus('lost');
            }

            setCurrentGuess('');
        }

        if (key === 'BACKSPACE') {
            setCurrentGuess(prev => prev.slice(0, -1));
        }

        if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
            setCurrentGuess(prev => prev + key);
        }
    };

    const checkGuess = (guess, solution) => {
        const solutionChars = solution.split('');
        const guessChars = guess.split('');
        
        // Create a copy of solution chars to track used letters
        const solutionCharCounts = {};
        solutionChars.forEach(char => {
            solutionCharCounts[char] = (solutionCharCounts[char] || 0) + 1;
        });

        // First pass: mark correct letters
        const result = guessChars.map((char, i) => {
            if (char === solutionChars[i]) {
                solutionCharCounts[char]--;
                return 'correct';
            }
            return 'unknown';
        });

        // Second pass: mark present and absent letters
        result.forEach((status, i) => {
            if (status === 'unknown') {
                if (solutionCharCounts[guessChars[i]] > 0) {
                    result[i] = 'present';
                    solutionCharCounts[guessChars[i]]--;
                } else {
                    result[i] = 'absent';
                }
            }
        });

        return result;
    };

    useEffect(() => {
        const handleKeyboard = (e) => {
            e.preventDefault();
            handleKeyPress(e.key);
        };

        window.addEventListener('keydown', handleKeyboard);
        return () => window.removeEventListener('keydown', handleKeyboard);
    }, [currentGuess, solution, gameStatus]);

    return (
        <div className="App">
            <h1>Bible Wordle</h1>
            {gameStatus !== 'playing' && (
                <div className="game-over">
                    {gameStatus === 'won' ? 'Congratulations! You won!' : `Game Over. The word was ${solution}`}
                    <button onClick={resetGame} className="redo-button">Play Again</button>
                </div>
            )}
            <div className="board">
                {guesses.map((guess, i) => {
                    const isCurrentGuess = i === guesses.findIndex(val => val == null);
                    return (
                        <div 
                            key={i} 
                            className={`row ${isCurrentGuess && shake ? 'shake' : ''}`}
                        >
                            {Array.from({ length: WORD_LENGTH }).map((_, j) => {
                                const char = isCurrentGuess 
                                    ? currentGuess[j] 
                                    : guess ? guess[j] : '';
                                
                                const className = guess 
                                    ? checkGuess(guess, solution)[j]
                                    : '';

                                return (
                                    <div 
                                        key={j} 
                                        className={`tile 
                                            ${className} 
                                            ${guess && revealedTiles[i][j] ? 'flip' : ''}
                                        `}
                                    >
                                        {char}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
            <div className="keyboard">
                {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, rowIndex) => (
                    <div key={rowIndex} className="keyboard-row">
                        {row.split('').map(key => (
                            <button 
                                key={key} 
                                onClick={() => handleKeyPress(key)}
                                className={`keyboard-key ${
                                    guessedLetters.correct.has(key) ? 'correct' :
                                    guessedLetters.present.has(key) ? 'present' :
                                    guessedLetters.absent.has(key) ? 'absent' : ''
                                }`}
                            >
                                {key}
                            </button>
                        ))}
                        {rowIndex === 1 && (
                            <button 
                                onClick={() => handleKeyPress('BACKSPACE')} 
                                className="keyboard-key special"
                            >
                                ⌫
                            </button>
                        )}
                        {rowIndex === 2 && (
                            <button 
                                onClick={() => handleKeyPress('ENTER')} 
                                className="keyboard-key special"
                            >
                                ENTER
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;