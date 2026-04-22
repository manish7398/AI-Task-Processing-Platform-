import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home">
      <h1>Welcome to AI Task Platform</h1>
      <p>Process your text with AI operations easily.</p>
      <div className="hero">
        <Link to="/register" className="btn-primary">Get Started</Link>
        <Link to="/login" className="btn-secondary">Login</Link>
      </div>
      <div className="features">
        <div className="feature">
          <h3>UPPERCASE</h3>
          <p>Convert text to uppercase</p>
        </div>
        <div className="feature">
          <h3>lowercase</h3>
          <p>Convert text to lowercase</p>
        </div>
        <div className="feature">
          <h3>Reverse</h3>
          <p>Reverse any text</p>
        </div>
        <div className="feature">
          <h3>Word Count</h3>
          <p>Count words in text</p>
        </div>
      </div>
    </div>
  );
};

export default Home;