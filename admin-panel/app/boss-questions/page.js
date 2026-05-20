'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '../../src/lib/api';

export default function BossQuestionsPage() {
  const [formData, setFormData] = useState({
    concept_id: 1,
    subject: 'Physics',
    chapter_name: 'Newton\'s Laws of Motion',
    topic_name: 'Forces',
    subtopic_name: 'Friction',
    concept_name: 'Static Friction',
    title: 'Truck Friction Problem',
    question_text: 'A block of mass 1 kg lies on a horizontal surface in a truck. The coefficient of static friction between the block and the surface is 0.6. If the acceleration of the truck is 5 m/s², what is the frictional force acting on the block? (Take g = 10 m/s²)',
    question_image_url: '',
    difficulty: 'medium',
    total_steps: 8,
    target_exam: 'JEE Advanced',
    language: 'english',
    source: 'JEE Advanced 1984'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) router.push('/');
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await apiCall('/admin/boss-questions', 'POST', formData);
      if (result.success) {
        setMessage('Boss question added successfully!');
        setFormData({
          concept_id: 1,
          subject: 'Physics',
          chapter_name: 'Newton\'s Laws of Motion',
          topic_name: 'Forces',
          subtopic_name: 'Friction',
          concept_name: 'Static Friction',
          title: '',
          question_text: '',
          question_image_url: '',
          difficulty: 'medium',
          total_steps: 8,
          target_exam: 'JEE Advanced',
          language: 'english',
          source: ''
        });
      } else {
        setMessage('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <nav className="nav">
        <a href="/dashboard" style={{ textDecoration: 'none', color: '#9090a8' }}>Dashboard</a>
        <a href="/boss-questions" style={{ textDecoration: 'none', color: '#6c63ff' }}>Boss Questions</a>
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { localStorage.removeItem('adminToken'); router.push('/'); }}>Sign Out</button>
      </nav>

      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Add Boss Question</h1>

        {message && <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

        <div className="card" style={{ maxWidth: '600px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Concept ID</label>
              <input type="number" name="concept_id" value={formData.concept_id} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Truck Friction Problem" required />
            </div>

            <div className="form-group">
              <label>Question Text</label>
              <textarea name="question_text" value={formData.question_text} onChange={handleChange} rows="4" required></textarea>
            </div>

            <div className="form-group">
              <label>Difficulty</label>
              <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label>Total Steps</label>
              <input type="number" name="total_steps" value={formData.total_steps} onChange={handleChange} min="4" max="8" required />
            </div>

            <div className="form-group">
              <label>Target Exam</label>
              <select name="target_exam" value={formData.target_exam} onChange={handleChange}>
                <option value="JEE Main">JEE Main</option>
                <option value="JEE Advanced">JEE Advanced</option>
                <option value="NEET">NEET</option>
                <option value="All">All</option>
              </select>
            </div>

            <div className="form-group">
              <label>Source</label>
              <input type="text" name="source" value={formData.source} onChange={handleChange} placeholder="JEE Advanced 1984" />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Boss Question'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}