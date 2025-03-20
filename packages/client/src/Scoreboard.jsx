function Scoreboard({ scores }) {
  return (
    <div
      style={{
        height: "100%",
        overflowY: "hidden",
        position: "absolute",
        right: 0,
        top: 0,
      }}
    >
      <h3>Score</h3>
      <ul style={{ listStyle: "none" }}>
        {Object.keys(scores).map((key) => (
          <li>
            {key}: {scores[key]}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Scoreboard;
