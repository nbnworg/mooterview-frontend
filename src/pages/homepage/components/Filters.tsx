import { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedLevel: string;
  setSelectedLevel: (value: string) => void;
  solved: string;
  setSolved: (value: string) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  onAddProblem: () => void;
}

export default function Filters({
  searchTerm,
  setSearchTerm,
  selectedLevel,
  setSelectedLevel,
  solved,
  setSolved,
  selectedTypes,
  setSelectedTypes,
  onAddProblem,
}: FiltersProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const problemTypes = [
    "Arrays & Hashing",
    "Two Pointers",
    "Stack",
    "Sliding Window",
    "Linked List",
    "Binary Search",
    "Trees",
    "Tries",
    "Heap/Priority Queue",
    "Backtracking"
  ];


  const toggleProblemType = (type: string) => {
    const normalizedType = type.trim().toLowerCase();
    if (selectedTypes.includes(normalizedType)) {
      setSelectedTypes(selectedTypes.filter(t => t !== normalizedType));
    } else {
      setSelectedTypes([...selectedTypes, normalizedType]);
    }
  };
  const dropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const removeProblemType = (type: string) => {
    setSelectedTypes(selectedTypes.filter(t => t !== type));
  };


  return (
    <div className="filterContainer">
      <input
        className="searchBar"
        type="text"
        placeholder="Search problems..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <hr className="horizontalLines" />
      <div className="filterOptionContainer">
        <p className="filterHeading">Levels:</p>
        {["All", "Easy", "Medium", "Hard"].map((level) => (
          <label className="radioButton" key={level}>
            <input
              type="radio"
              name="level"
              value={level}
              onChange={(e) => setSelectedLevel(e.target.value)}
              checked={selectedLevel === level}
            />
            {level}
          </label>
        ))}
      </div>
      <hr className="horizontalLines" />
      <div className="filterOptionContainer">
        <p className="filterHeading">Status:</p>
        <label className="radioButton">
          <input
            type="radio"
            name="status"
            value="All"
            onChange={(e) => setSolved(e.target.value)}
            checked={solved === "All"}
          />
          All
        </label>
        <label className="radioButton">
          <input
            type="radio"
            name="status"
            value="Solved"
            onChange={(e) => setSolved(e.target.value)}
            checked={solved === "Solved"}
          />
          Attempted
        </label>
        <label className="radioButton">
          <input
            type="radio"
            name="status"
            value="UnSolved"
            onChange={(e) => setSolved(e.target.value)}
            checked={solved === "UnSolved"}
          />
          Not Attempted
        </label>
      </div>
      <hr className="horizontalLines" />
      <div className="multiSelectContainer" ref={dropdownRef}>
        <p className="filterHeading">Problem Types:</p>
        <div
          className="dropdownHeader"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span>Select problem types...</span>
          {isDropdownOpen ? (
            <FaChevronUp className="dropdownIcon" />
          ) : (
            <FaChevronDown className="dropdownIcon" />
          )}
        </div>

        <div className={`dropdownOptions ${isDropdownOpen ? 'open' : ''}`}>
          {problemTypes.map((type) => (
            <label className="checkboxOption" key={type}>
              <input
                type="checkbox"
                checked={selectedTypes.includes(type.trim().toLowerCase())}
                onChange={() => toggleProblemType(type)}
              />
              {type}
            </label>
          ))}
        </div>

        <div className="selectedTags">
          {selectedTypes.map(type => (
            <span key={type} className="selectedTag">
              {type}
              <button
                type="button"
                className="removeTag"
                onClick={() => removeProblemType(type)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      <hr className="horizontalLines" />
      <button className="createProblemButton" onClick={onAddProblem}>
        Add New Problem
      </button>
    </div>
  );
}