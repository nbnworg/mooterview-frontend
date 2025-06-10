/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import "./createProblem.css";
import axios from "axios";
import { BASE_URL } from "../../utils/constants";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useNavigate } from "react-router-dom";

const CreateProblem = () => {
  const [formData, setFormData] = useState({
    title: "",
    problemStatement: "",
    problemDescription: "",
    level: "",
    averageSolveTime: "",
    totalUsersAttempted: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Form Data:", formData);
    try {
      await axios.post(`${BASE_URL}/problems`, formData);
      setSuccess("Problem created successfully!");
      setFormData({
        title: "",
        problemStatement: "",
        problemDescription: "",
        level: "",
        averageSolveTime: "",
        totalUsersAttempted: "",
      });

      navigate("/home");
    } catch (error: any) {
      setError(
        error.response?.data || "Server Is busy, Can't Fetch problem right now."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="CreateProblemSection">
      <h1>Create A Problem</h1>
      {error && (
        <div className="errorMessage">
          <p>{error}</p>
          <button onClick={() => setError("")}>
            <IoIosCloseCircleOutline />
          </button>
        </div>
      )}

      {success && (
        <div className="successMessage">
          <p>{success}</p>
          <button onClick={() => setSuccess("")}>
            <IoIosCloseCircleOutline />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          id="title"
          placeholder="Enter Problem Title"
          value={formData.title}
          onChange={handleInputChange}
        />
        <textarea
          name="problemStatement"
          id="statement"
          rows={5}
          placeholder="Enter Problem Statement"
          value={formData.problemStatement}
          onChange={handleInputChange}
        />
        <textarea
          name="problemDescription"
          id="description"
          rows={5}
          placeholder="Enter Problem description"
          value={formData.problemDescription}
          onChange={handleInputChange}
        />
        <select
          name="level"
          id="level"
          value={formData.level}
          onChange={handleInputChange}
          required
        >
          <option value="" disabled>
            Select Difficulty Level
          </option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <input
          type="text"
          name="averageSolveTime"
          id="averageSolveTime"
          placeholder="Enter Average problem time"
          value={formData.averageSolveTime}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="totalUsersAttempted"
          id="totalUserAttempted"
          placeholder="Enter Total number of user attempted"
          value={formData.totalUsersAttempted}
          onChange={handleInputChange}
        />
        <button type="submit" className="submitButton">
          {loading ? <div className="loader"></div> : "Create problem"}
        </button>
      </form>
    </section>
  );
};

export default CreateProblem;
