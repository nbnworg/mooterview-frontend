/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import "./createProblem.css";
import axios from "axios";
import { BASE_URL, getTokenData } from "../../utils/constants";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";

const CreateProblem = () => {
  const [formData, setFormData] = useState({
    title: "",
    problemDescription: "",
    averageSolveTime: "",
    problemPattern: "",
    level: "",
    sampleInput: "",
    sampleOutput: "",
    example: "",
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
    const endpoint = `${BASE_URL}/problems`;

    try {
      const tokenData = getTokenData();
      if (!tokenData) throw new Error("No token found");

      await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
        },
      });
      localStorage.removeItem("cachedProblems");


      setSuccess("Problem created successfully!");
      setFormData({
        title: "",
        problemDescription: "",
        averageSolveTime: "",
        problemPattern: "",
        level: "",
        sampleInput: "",
        sampleOutput: "",
        example: "",
      });

      navigate("/home");
    } catch (error: any) {
      setError(
        error.response?.data || "Server is busy. Cannot create problem now."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
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
            placeholder="Enter Problem Title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />

          <textarea
            name="problemDescription"
            placeholder="Enter Full Problem"
            value={formData.problemDescription}
            onChange={handleInputChange}
            rows={4}
            required
          />

          <select
            name="problemPattern"
            value={formData.problemPattern}
            onChange={handleInputChange}
            required
          >
            <option value="" disabled>
              Select Type:
            </option>
            <option value="Arrays">Arrays & Hashing</option>
            <option value="Two Pointers">Two Pointers</option>
            <option value="Stack">Stack</option>
            <option value="Sliding Window">Sliding Window</option>
            <option value="Linked List">Linked List</option>
            <option value="Binary Search">Binary Search</option>
            <option value="Trees">Trees</option>
            <option value="Tries">Tries</option>
            <option value="Heap / Priority Queue">Heap / Priority Queue</option>
            <option value="Backtracking">Backtracking</option>
            <option value="Dynamic Programming">Dynamic Programming</option>
            <option value="Graphs">Graphs</option>
            <option value="Greedy">Greedy</option>
            <option value="Math & Geometry">Math & Geometry</option>
            <option value="Bit Manipulation">Bit Manipulation</option>
          </select>

          <select
            name="level"
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
            placeholder="Enter Avg. Solve Time (e.g., 5 mins)"
            value={formData.averageSolveTime}
            onChange={handleInputChange}
            required      // making this field manadatory to fill
            min = {5}     // having some base value
          />

          <textarea
            name="sampleInput"
            placeholder="Enter Sample Input"
            value={formData.sampleInput}
            onChange={handleInputChange}
            rows={2}
          />

          <textarea
            name="sampleOutput"
            placeholder="Enter Sample Output"
            value={formData.sampleOutput}
            onChange={handleInputChange}
            rows={2}
          />

          <textarea
            name="example"
            placeholder="Enter Problem Example"
            value={formData.example}
            onChange={handleInputChange}
            rows={2}
          />

          <button type="submit" className="submitButton">
            {loading ? <div className="loader"></div> : "Create Problem"}
          </button>
        </form>
      </section>
    </>
  );
};

export default CreateProblem;
