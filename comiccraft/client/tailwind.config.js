export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {
    colors: { ink: "#1B1B2F", sun: "#FFD23F", pop: "#FF5D8F", sky: "#3A86FF", mint: "#2EC4B6", wash: "#EEF0FF" },
    fontFamily: { display: ["Bangers", "cursive"], body: ["Nunito", "sans-serif"] },
    boxShadow: { comic: "5px 5px 0 #1B1B2F" },
  } },
};
