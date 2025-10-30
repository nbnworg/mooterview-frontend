import Navbar from "../../../components/navbar/Navbar";
import "./t&c.css";

const TermsAndConditions = () => {
    return (
        <>
            <Navbar />
            <div className="terms-container">
                <div className="terms-wrapper">
                    <h1 className="terms-heading">Terms & Conditions</h1>

                    <section className="terms-section">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using{" "}
                            <strong>mooterview</strong>, you agree to follow
                            and be bound by these Terms & Conditions.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>2. Account Responsibilities</h2>
                        <p>Users must:</p>
                        <ul>
                            <li>Provide accurate registration details.</li>
                            <li>
                                Maintain confidentiality of their account
                                credentials.
                            </li>
                            <li>
                                Accept responsibility for activities performed
                                under their account.
                            </li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>3. AI Usage and Limitations</h2>
                        <p>
                            Mooterview uses prompts to interact with
                            third-party AI models (e.g., OpenAI). We do not
                            build or own any AI model. We only process your
                            inputs and forward them to the third-party provider
                            for response generation.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>4. User Restrictions</h2>
                        <p>Users must not:</p>
                        <ul>
                            <li>
                                Use the service for illegal or unethical
                                interview practices.
                            </li>
                            <li>
                                Attempt reverse engineering, security tampering,
                                or hacking.
                            </li>
                            <li>
                                Upload content that is harmful, discriminatory,
                                or copyrighted material.
                            </li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>5. No Guarantees or Liability</h2>
                        <p>
                            Mooterview does not guarantee hiring outcomes,
                            interview success, or AI accuracy. We are not liable
                            for decisions made by third-party AI.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>6. Modifications</h2>
                        <p>
                            We may update these Terms anytime. Continued use
                            means you accept the updated Terms.
                        </p>
                    </section>

                    {/* <section className="terms-section">
                        <h2>7. Contact</h2>
                        <p>
                            For any questions regarding these terms, please
                            reach out to us from the “Support” section available
                            within the platform dashboard.
                        </p>
                    </section> */}
                </div>
            </div>
        </>
    );
};

export default TermsAndConditions;
