'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '../../src/lib/api';

const steps = [
  {
    step_number: 1,
    concept_tag: 'Friction Basics',
    question_text: 'A book is lying on a table. You try to push it but it doesn\'t move. What force is stopping it?',
    option_a: 'Gravity',
    option_b: 'Static friction',
    option_c: 'Normal force',
    option_d: 'Applied force',
    correct_options: 'b',
    explanation: 'Static friction is the force that prevents the book from moving when you push it.',
    theory_card: 'Static friction acts opposite to applied force and prevents motion.',
    video_url: '',
    difficulty: 'easy',
    marks: 4
  },
  {
    step_number: 2,
    concept_tag: 'Normal Force',
    question_text: 'A block of mass 2 kg rests on a horizontal surface. What is the normal force? (g=10 m/s²)',
    option_a: '10 N',
    option_b: '20 N',
    option_c: '30 N',
    option_d: '40 N',
    correct_options: 'b',
    explanation: 'On horizontal surface: N = mg = 2 × 10 = 20 N',
    theory_card: 'Normal force equals weight on horizontal surfaces.',
    video_url: '',
    difficulty: 'easy',
    marks: 4
  },
  {
    step_number: 3,
    concept_tag: 'Max Static Friction',
    question_text: 'A 2 kg block on surface has μₛ=0.4. What is maximum static friction? (g=10 m/s²)',
    option_a: '4 N',
    option_b: '8 N',
    option_c: '12 N',
    option_d: '16 N',
    correct_options: 'b',
    explanation: 'f_max = μₛ × N = 0.4 × 20 = 8 N',
    theory_card: 'Maximum static friction = μₛ × N',
    video_url: '',
    difficulty: 'medium',
    marks: 4
  },
  {
    step_number: 4,
    concept_tag: 'Self-Adjusting Friction',
    question_text: 'Force of 3 N applied to block where f_max=10 N. Block stays still. What is friction force?',
    option_a: '10 N',
    option_b: '7 N',
    option_c: '3 N',
    option_d: '0 N',
    correct_options: 'c',
    explanation: 'Static friction adjusts to exactly match applied force (if below f_max).',
    theory_card: 'Static friction is self-adjusting from 0 to f_max.',
    video_url: '',
    difficulty: 'medium',
    marks: 4
  },
  {
    step_number: 5,
    concept_tag: 'Newton\'s 2nd Law',
    question_text: 'Block of mass 1 kg accelerates at 5 m/s². What is net force?',
    option_a: '2 N',
    option_b: '5 N',
    option_c: '8 N',
    option_d: '10 N',
    correct_options: 'b',
    explanation: 'F = ma = 1 × 5 = 5 N',
    theory_card: 'Newton\'s 2nd Law: F = ma',
    video_url: '',
    difficulty: 'medium',
    marks: 4
  },
  {
    step_number: 6,
    concept_tag: 'Force in Vehicle',
    question_text: 'Block on accelerating bus floor. What force makes it accelerate with bus?',
    option_a: 'Air resistance',
    option_b: 'Gravity',
    option_c: 'Static friction from floor',
    option_d: 'Engine force',
    correct_options: 'c',
    explanation: 'Friction from floor is the only horizontal force on unsecured block.',
    theory_card: 'In vehicles, friction transfers acceleration to objects.',
    video_url: '',
    difficulty: 'medium',
    marks: 4
  },
  {
    step_number: 7,
    concept_tag: 'Slip Condition',
    question_text: 'Block needs 6 N to keep up with truck. f_max=9 N. What happens?',
    option_a: 'Block slips backward',
    option_b: 'Block accelerates with truck',
    option_c: 'Block slides forward',
    option_d: 'Block lifts off',
    correct_options: 'b',
    explanation: 'Since 6 N < 9 N, friction can provide needed force. No slipping.',
    theory_card: 'No slip when: force_needed ≤ f_max',
    video_url: '',
    difficulty: 'hard',
    marks: 4
  },
  {
    step_number: 8,
    concept_tag: 'Full Integration (Boss)',
    question_text: 'Block of mass 1 kg on truck with μₛ=0.6, acceleration 5 m/s². Find friction. (g=10)',
    option_a: '6 N',
    option_b: '5 N',
    option_c: '1 N',
    option_d: '10 N',
    correct_options: 'b',
    explanation: 'f_max=0.6×1×10=6N. Needed=1×5=5N. Since 5<6, friction=5N.',
    theory_card: 'This is the complete problem. All 7 concepts combined.',
    video_url: '',
    difficulty: 'hard',
    marks: 4,
    is_boss_step: true
  }
];

export default function LadderStepsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stepsAdded, setStepsAdded] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) router.push('/');
  }, [router]);

  const handleAddAllSteps = async () => {
    setLoading(true);
    setMessage('');
    let added = 0;

    for (const step of steps) {
      try {
        const result = await apiCall('/admin/ladder-steps', 'POST', {
          boss_question_id: 1,
          ...step,
          question_type: 'mcq',
          target_exam: 'JEE Advanced',
          language: 'english',
          source: 'Created for testing'
        });
        if (result.success) {
          added++;
          setStepsAdded(added);
        }
      } catch (err) {
        console.error('Error adding step:', err);
      }
    }

    setMessage(`Added ${added} of ${steps.length} steps successfully!`);
    setLoading(false);
  };

  return (
    <div>
      <nav className="nav">
        <a href="/dashboard" style={{ textDecoration: 'none', color: '#9090a8' }}>Dashboard</a>
        <a href="/ladder-steps" style={{ textDecoration: 'none', color: '#6c63ff' }}>Ladder Steps</a>
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { localStorage.removeItem('adminToken'); router.push('/'); }}>Sign Out</button>
      </nav>

      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Add 8+1 Ladder Steps</h1>

        {message && <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

        <div className="card" style={{ maxWidth: '600px' }}>
          <p style={{ marginBottom: '1rem', color: '#9090a8' }}>
            This will add all 8 scaffolded questions for the Truck Friction problem.
          </p>
          <p style={{ marginBottom: '2rem', color: '#9090a8', fontSize: '13px' }}>
            Steps added: {stepsAdded} / {steps.length}
          </p>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleAddAllSteps}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? `Adding... (${stepsAdded}/${steps.length})` : 'Add All 8 Steps'}
          </button>
        </div>

        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Preview of Steps:</h3>
          {steps.map((step, i) => (
            <div key={i} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>Step {step.step_number}: {step.concept_tag}</p>
              <p style={{ fontSize: '13px', color: '#9090a8' }}>{step.question_text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}