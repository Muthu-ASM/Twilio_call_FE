import axios from "axios";

const Instance = axios.create({
  baseURL: "http://localhost:3002",
});

const getToken = () => Instance({ method: "GET", url: "/api/token" });

const startRecording = () =>
  Instance({ method: "GET", url: "/api/startRecording" });

export { getToken, startRecording };
