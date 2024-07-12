import { useEffect, useState } from "react";
import { Device } from "@twilio/voice-sdk";
import { startRecording } from "./services";

//Types
const USER_STATE = {
  CONNECTING: "Connecting",
  READY: "Ready",
  ON_CALL: "On call",
  OFFLINE: "Offline",
  END_CALL: "Call end",
};

const numberList = [1, 2, 3, 4, 5, 6, 7, 8, 9, "+", 0, "<<"];

const stateColor = {
  [USER_STATE.CONNECTING]: "#B7AC44",
  [USER_STATE.READY]: "#DAD870",
  [USER_STATE.ON_CALL]: "#FF5C4D",
  [USER_STATE.OFFLINE]: "#FFB52E",
};

//Helpers
const Timer = () => {
  const [timer, setTimer] = useState({ mins: 0, sec: 0 });
  const getTime = () => {
    setTimer((state) => ({
      mins: state.sec === 60 ? state.mins + 1 : state.mins,
      sec: state.sec === 60 ? 0 : state.sec + 1,
    }));
  };
  useEffect(() => {
    const interval = setInterval(() => getTime(), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="timer">
      {`${timer.mins < 9 ? "0" + timer.mins : timer.mins} : ${
        timer.sec < 9 ? "0" + timer.sec : timer.sec
      }`}
    </div>
  );
};

//Components
const Phone = ({ token }) => {
  //State
  const [userState, setUserState] = useState(USER_STATE.OFFLINE);
  const [phoneNumber, setPhoneNumber] = useState("+918056452060");
  const [connection, setConnection] = useState(null);
  const [callDevice, setDevice] = useState();
  const [recordingUrl, setRecordingUrl] = useState("");

  //Callback
  useEffect(() => {
    init();
  }, [token]);

  //Helpers
  const init = async () => {
    if (token) {
      try {
        console.log("Token connected successfully!!", token);
        const device = new Device(token, {
          logLevel: 1,
          edge: "ashburn",
        });

        device.register();
        setDevice(device);
        device.addListener("connect", (device) => {
          console.log("Connect event listener added .....");
          return device;
        });
        device.on("registered", () => {
          console.log("Agent registered");
          setUserState(USER_STATE.READY);
        });
        device.on("connect", async (connection) => {
          console.log("Call connect");
          const recordings = await startRecording();
          console.log("recordings===", recordings);
          setConnection(connection);
          setUserState(USER_STATE.ON_CALL);
        });
        device.on("disconnect", () => {
          console.log("Disconnect event");
          setUserState(USER_STATE.READY);
          setConnection(null);
        });

        device.on("error", (error) => {
          console.error("Twilio Device Error: ", error);
          setUserState(USER_STATE.OFFLINE);
        });

        device.setup();
        setDevice(device);

        return () => {
          device.destroy();
          setDevice(undefined);
          setUserState(USER_STATE.OFFLINE);
        };
      } catch (error) {
        console.log("Error", error);
      }
    }
  };

  const handleCall = async () => {
    const params = { To: phoneNumber, Record: true };
    callDevice?.emit("connect");
    callDevice?.emit("ringing");

    callDevice
      ?.connect({
        params: params,
        rtcConstraints: {
          audio: true,
        },
      })
      .then((call) => {
        call.on("ringing", () => {
          console.log("Call is ringing.");
          setUserState("Ringing");
        });

        call.on("accept", () => {
          setConnection(connection);
          setUserState(USER_STATE.ON_CALL);
          console.log("call accepted");
        });

        if (call.status() === "connecting") {
          console.log("Connecting...>>>");
        }

        call.on("disconnect", () => {
          console.log("The call has been disconnected.");
          fetchRecordingUrl(call.parameters.CallSid);
          setUserState(USER_STATE.END_CALL);
          setConnection(null);
        });

        call.on("reject", () => {
          console.log("The call was rejected.");
        });
      });
  };

  const handleHangup = () => {
    if (callDevice) {
      callDevice.disconnectAll();
    }
  };

  const fetchRecordingUrl = (callSid) => {
    fetch("http://localhost:3002/api/fetchRecording", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ callSid }),
    })
      .then((response) => response.json())
      .then((data) => {
        const recordingUrl = data.recordingUrl;
        getAnRecordingsURl(recordingUrl);
      })
      .catch((error) => console.error("Error fetching recording URL: ", error));
  };

  const getAnRecordingsURl = (recordingUrl) => {
    // Extract the Recording SID from the provided recordingUrl
    if (recordingUrl) {
      const recordingSid = recordingUrl?.split("/").pop().split(".")[0];
      const audioUrl = `https://api.twilio.com/2010-04-01/Accounts/AC685ee4ca81febfb3df4974b3160a85f8/Recordings/${recordingSid}.mp3`;
      fetch(audioUrl, {
        headers: {
          Authorization: `Basic ${btoa(
            "AC685ee4ca81febfb3df4974b3160a85f8:e9a6336f44a04a8aee19844878b353d0"
          )}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch audio file");
          }
          return response.blob();
        })
        .then((blob) => {
          const audioSrc = URL.createObjectURL(blob);
          setRecordingUrl(audioSrc);
        })
        .catch((error) => {
          console.error("Failed to fetch audio:", error);
        });
    }
  };

  console.log("userState=========", userState);

  //Render Element
  return (
    <div className="phone">
      <div className="user-state">
        <i style={{ color: stateColor[userState] }} className="fas fa-stop"></i>{" "}
        {`Status - > ${userState}`}
      </div>
      <input
        className="number-input"
        value={phoneNumber}
        onChange={(event) => setPhoneNumber(event.target.value)}
      />
      {userState === USER_STATE.ON_CALL ? (
        <Timer />
      ) : (
        <div className="gird">
          {numberList.map((value) => (
            <div
              key={value}
              className="number"
              onClick={() => {
                if (value === "<<") {
                  setPhoneNumber(
                    phoneNumber.substring(0, phoneNumber.length - 1)
                  );
                } else {
                  setPhoneNumber(phoneNumber + value);
                }
              }}
            >
              {value}
            </div>
          ))}
        </div>
      )}
      <div
        className={`${
          userState === USER_STATE.ON_CALL ? "in-call" : "call"
        } button`}
      >
        {userState === USER_STATE.ON_CALL ? (
          <i className="material-icons" onClick={() => handleHangup()}>
            call_end
          </i>
        ) : (
          <i className="material-icons" onClick={() => handleCall()}>
            call
          </i>
        )}
      </div>

      {/**
       * Audio player
       */}
      {recordingUrl && <audio controls src={recordingUrl}></audio>}
    </div>
  );
};

export default Phone;
