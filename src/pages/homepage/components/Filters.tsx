interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedLevel: string;
  setSelectedLevel: (value: string) => void;
  solved: string;
  setSolved: (value: string) => void;
  onAddProblem: () => void;
}

export default function Filters({
  searchTerm,
  setSearchTerm,
  selectedLevel,
  setSelectedLevel,
  solved,
  setSolved,
  onAddProblem,
}: FiltersProps) {
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
      <button className="createProblemButton" onClick={onAddProblem}>
        Add New Problem
      </button>
    </div>
  );
}
