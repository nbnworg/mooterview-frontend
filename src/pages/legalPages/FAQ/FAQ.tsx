import Navbar from "../../../components/navbar/Navbar";
import "./faq.css";

const FAQ = () => {
  return (
    <>
    <Navbar />
    <div className="faq-container">
      <div className="faq-wrapper">
        <h1 className="faq-heading">Frequently Asked Questions</h1>

        <div className="faq-item">
          <h2>What is mooterview.com?</h2>
          <p>
            mooterview.com is an AI-powered mock interview platform helping users
            practice interview questions, get feedback, and improve confidence.
          </p>
        </div>

        <div className="faq-item">
          <h2>Do you store interview answers?</h2>
          <p>
            Yes, but only for improving user experience and analytics. You may request
            deletion anytime.
          </p>
        </div>

        <div className="faq-item">
          <h2>Do you build your own AI model?</h2>
          <p>
            No. We use AI through prompts from third-party providers like OpenAI.
          </p>
        </div>

        <div className="faq-item">
          <h2>Will using this platform guarantee job placement?</h2>
          <p>No. We help improve skills but cannot guarantee hiring outcomes.</p>
        </div>

        {/* <div className="faq-item">
          <h2>How do I contact support?</h2>
          <p>
            Email: <a href="mailto:support@mooterview.com">support@mooterview.com</a>
          </p>
        </div> */}
      </div>
    </div>
    </>
  );
};

export default FAQ;
