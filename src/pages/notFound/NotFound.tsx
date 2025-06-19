import { Link } from "react-router-dom";
import "./notFound.css";

const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1>404 – Page not found</h1>
      <p>
        Return to <Link to="/home">home</Link>.
      </p>
    </div>
  );
};

export default NotFound;
