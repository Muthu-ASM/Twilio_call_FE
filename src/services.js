import axios from "axios";

const Instance = axios.create({
  baseURL: "http://localhost:3002",
});

const getToken = () => Instance({ method: "GET", url: "/api/token" });

export { getToken };
