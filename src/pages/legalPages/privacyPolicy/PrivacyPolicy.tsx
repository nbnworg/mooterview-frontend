import Navbar from "../../../components/navbar/Navbar";
import "./privacyPolicy.css";

const PrivacyPolicy = () => {
    return (
        <>
            <Navbar />
            <div className="privacy-container">
                <div className="privacy-wrapper">
                    <h1 className="privacy-heading">Privacy Policy</h1>

                    <section className="privacy-section">
                        <h2>1. Information We Collect</h2>
                        <ul>
                            <li>
                                Personal details: name, email, account
                                information.
                            </li>
                            <li>
                                Interview session data: responses, answers,
                                uploads.
                            </li>
                            <li>Usage data for performance analytics.</li>
                        </ul>
                    </section>

                    <section className="privacy-section">
                        <h2>2. AI Processing Notice</h2>
                        <p>
                            Your inputs may be sent to third-party AI providers
                            (OpenAI or similar). We do not own, train, or modify
                            the AI models — we only use them through APIs.
                        </p>
                    </section>

                    <section className="privacy-section">
                        <h2>3. Data Security</h2>
                        <p>
                            We use encryption and industry-standard security
                            practices. However, no system is 100% secure.
                        </p>
                    </section>

                    {/* <section className="privacy-section">
                        <h2>4. Data Deletion</h2>
                        <p>
                            You may request deletion of your account and stored
                            session data anytime by emailing:
                            <br />
                            <a href="mailto:privacy@mooterview.com">
                                privacy@mooterview.com
                            </a>
                        </p>
                    </section> */}

                    <section className="privacy-section">
                        <h2>4. Third-Party Sharing</h2>
                        <p>
                            We do <strong>not</strong> sell or trade your
                            personal data. Data may be shared only with:
                        </p>
                        <ul>
                            <li>
                                AI processing providers (strictly for generating
                                responses).
                            </li>
                            <li>Legal authorities when required by law.</li>
                        </ul>
                    </section>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicy;
