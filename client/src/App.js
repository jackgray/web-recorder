import React, { useState, useEffect } from "react";
import RecordRTC from "recordrtc";
import NavBar from "./NavBar";
import { lightTheme, darkTheme } from "./themes";
import "bootstrap/dist/css/bootstrap.min.css";
// import "./custom.css";

import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  Grommet,
  grommet,
  Header,
  Page,
  PageContent,
  PageHeader,
  Text,
  TextInput,
  Select,
  Paragraph,
  RangeInput,
} from "grommet";

// GENERATE A NAME FOR THE AUDIO FILES
function generateFilename(study, subj, sesType, sesNum, task, ver, acq) {
  sesNum = String(sesNum).padStart(2, "0");
  let acqPart = "";
  if (acq) {
    acqPart = `_acq-${acq}`;
  }
  let verPart = "";
  if (ver) {
    verPart = `_v-${ver}`;
  }
  let filename = `sub-${study}${subj.replace(
    "S",
    ""
  )}_ses-${sesType}${sesNum}_task-${task}${verPart}${acqPart}_audio`;

  return filename;
}

// import formatTime from './formatTime'

function formatTime(seconds, isRunning) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return isRunning ? `${formattedMinutes}:${formattedSeconds}` : "00:00";
}

function App() {
  const [serverEndpoint, setServerEndpoint] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [subj, setSubj] = useState("S");
  const [sesType, setSesType] = useState("");
  const [sesNum, setSesNum] = useState("");
  const [pageOptions, setPageOptions] = useState([]);
  const [studyOptions, setStudyOptions] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState(false);
  const [taskOptions, setTaskOptions] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [taskName, setTaskName] = useState("");
  const [acqOptions, setAcqOptions] = useState([]);
  const [selectedAcq, setSelectedAcq] = useState("");
  const [selectedVer, setSelectedVer] = useState("");
  const [verOptions, setVerOptions] = useState([]);
  const [sessionOptions, setSessionOptions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerValue, setTimerValue] = useState(timerDuration);
  const [sliderValue, setSliderValue] = useState(5);
  const [sessionSliderValue, setSessionSliderValue] = useState(1);
  const [darkMode, setDarkMode] = useState(true);
  const [serverLoading, setServerLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/config/serverOptions.json")
      .then((response) => response.json())
      .then((config) => {
        // You have your configuration here
        console.log(`setting server endpoint: ${config.SERVER_ENDPOINT}`);
        setServerEndpoint(config.SERVER_ENDPOINT);
        console.log(`Checking serverEndpoint state: ${serverEndpoint}`);
        console.log(`Checking setServerEndpoint: ${setServerEndpoint}`);
        setServerLoading(false);
      });
  }, []);

  useEffect(() => {
    console.log(
      `Checking serverEndpoint state inside config retreival: ${serverEndpoint}`
    );
    console.log(
      `Checking setServerEndpoint inside config retrieval: ${setServerEndpoint}`
    );

    if (serverEndpoint) {
      console.log("serverEndpoint var detected");
      console.log("Executing config promise");
      Promise.all([
        fetch(`${serverEndpoint}/config/pageOptions.json`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch page options");
            }
            console.log(response);
            return response.json();
          })
          .then((data) => {
            setPageOptions(data);
            // setSelectedStudy(data[0]?.value);
          })
          .catch((error) => {
            console.error("Error loading page options:", error);
          }),

        fetch(`${serverEndpoint}/config/studyOptions.json`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch study options");
            }
            console.log(response);
            return response.json();
          })
          .then((data) => {
            setStudyOptions(data);
            setSelectedStudy(data[0]?.value);
          })
          .catch((error) => {
            console.error("Error loading study options:", error);
          }),

        // Fetch sessionOptions.json
        fetch(`${serverEndpoint}/config/sessionOptions.json`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch session options");
            }
            return response.json();
          })
          .then((data) => {
            setSessionOptions(data);
            setSelectedSession(data[0]?.value);
          })
          .catch((error) => {
            console.error("Error loading session options:", error);
          }),

        fetch(`${serverEndpoint}/config/taskOptions.json`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch task options");
            }
            return response.json();
          })
          .then((data) => {
            setTaskOptions(data);
            setSelectedTask(data[0]?.value);
            setTaskPrompt(data[0]?.prompt);
          })
          .catch((error) => {
            console.error("Error loading task options:", error);
          }),
      ])
        .then(() => {
          console.log(
            "Finished loading config. Switching loading state to false."
          );
          setConfigLoading(false);
          console.log(
            `Testing loading state (should be false): ${serverLoading}`
          );
        })
        .catch((error) => {
          console.error("Error loading options:", error);
        });
    }
  }, [serverEndpoint]);

  useEffect(() => {
    if (configLoading) return;

    const selectedTaskObj = taskOptions.find(
      (task) => task.value === selectedTask
    );
    if (selectedTaskObj && selectedTaskObj.ver) {
      setVerOptions(selectedTaskObj.ver);
      setSelectedVer(selectedTaskObj.ver[0]?.value || null);
    } else {
      setVerOptions([]);
      setSelectedVer(null);
    }
    setLoading(false);
  }, [selectedTask, taskOptions, configLoading]);

  useEffect(() => {
    if (configLoading) return;

    const selectedVerObj = verOptions.find((ver) => ver.value === selectedVer);
    if (selectedVerObj && selectedVerObj.acq) {
      setAcqOptions(selectedVerObj.acq);
      setSelectedAcq(selectedVerObj.acq[0]?.value || null);
    } else {
      const selectedTaskObj = taskOptions.find(
        (task) => task.value === selectedTask
      );
      if (selectedTaskObj && selectedTaskObj.acq) {
        setAcqOptions(selectedTaskObj.acq);
        setSelectedAcq(selectedTaskObj.acq[0]?.value || null);
      } else {
        setAcqOptions([]);
        setSelectedAcq(null);
      }
    }
    setLoading(false);
  }, [
    selectedTask,
    selectedVer,
    taskOptions,
    verOptions,
    acqOptions,
    configLoading,
  ]);

  useEffect(() => {
    if (configLoading) return;

    if (selectedVer) {
      const ver = verOptions.find(
        (verOption) => verOption.value === selectedVer
      );
      if (ver && ver.acq) {
        setAcqOptions(ver.acq);
      } else {
        setAcqOptions([]);
        setSelectedAcq(null);
      }
    }
  }, [selectedVer, verOptions, configLoading]);

  useEffect(() => {
    if (configLoading) return;

    const selectedTaskObj = taskOptions.find(
      (task) => task.value === selectedTask
    );
    const selectedAcqObj = acqOptions.find((acq) => acq.value === selectedAcq);
    const selectedVerObj = verOptions.find((ver) => ver.value === selectedVer);

    if (selectedVerObj && selectedVerObj.prompt) {
      setTaskPrompt(selectedVerObj.prompt);
    } else if (selectedAcqObj && selectedAcqObj.prompt) {
      setTaskPrompt(selectedAcqObj.prompt);
    } else if (selectedTaskObj && selectedTaskObj.prompt) {
      setTaskPrompt(selectedTaskObj.prompt);
    } else {
      setTaskPrompt("");
    }
    setLoading(false);
  }, [
    selectedTask,
    selectedAcq,
    selectedVer,
    taskOptions,
    acqOptions,
    verOptions,
    configLoading,
  ]);

  useEffect(() => {
    if (configLoading) return;

    let intervalId;
    if (timerRunning) {
      intervalId = setInterval(() => {
        setTimerValue((prevValue) => prevValue - 1);
      }, 1000);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [timerRunning, configLoading]);

  const startRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 2,
        sampleRate: 48000,
        sampleSize: 16,
      },
    });

    const recordRTC = RecordRTC(stream, {
      type: "audio",
      mimeType: "audio/webm",
    });
    recordRTC.startRecording();
    setRecorder(recordRTC);

    // Convert timerDuration to total seconds
    const totalSeconds = sliderValue * 60;

    // Set initial values for minutes and seconds
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    // Set initial value for timerValue
    setTimerValue(totalSeconds);

    // Start the timer
    setTimerRunning(true);

    const countdownInterval = setInterval(() => {
      // Decrement seconds
      seconds--;
      // Decrement minutes if seconds reach zero
      if (seconds < 0) {
        minutes--;
        seconds = 59;
      }

      // Check if timer has reached zero
      if (minutes === 0 && seconds === 0) {
        clearInterval(countdownInterval);
        setTimerRunning(false);
      }

      // Update timerValue
      setTimerValue(minutes * 60 + seconds);
    }, 1000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setTimerRunning(false);
    setTimerValue(sliderValue * 60);
    recorder.stopRecording(async () => {
      // Generate the filename
      const filename = generateFilename(
        selectedStudy,
        subj,
        sesType,
        sessionSliderValue,
        selectedTask,
        selectedVer,
        selectedAcq
      );

      const blob = recorder.getBlob();
      const blobType = blob.type;
      const blobExtension = blobType.split("/")[1];
      const webfilename = filename + "." + blobExtension;
      console.log("using ", webfilename);
      console.log(blob.type);

      const formData = new FormData();
      formData.append("audio", blob, webfilename);
      formData.append("subj", subj);
      formData.append("ses_type", sesType);
      formData.append("ses_num", String(sessionSliderValue).padStart(2, "0"));
      formData.append("study", selectedStudy);
      formData.append("task", selectedTask);
      formData.append("acq", selectedAcq);
      formData.append("ver", selectedVer);

      try {
        console.log("Fetching audio file from server (/uploads)");
        const response = await fetch(`${serverEndpoint}/uploads`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          console.log("fetched json data: ", data);
          const mp3Download = serverEndpoint + data.url;
          console.log("Path to mp3 file: ", mp3Download);
          const mp3Blob = await fetch(mp3Download).then((res) => res.blob());

          // Create a link to download the MP3 file
          const link = document.createElement("a");
          link.href = URL.createObjectURL(mp3Blob);
          link.download = data.filename;
          link.click();
        } else {
          console.error("Error uploading the audio file.");
        }
      } catch (err) {
        console.error("Error uploading audio:", err.stack);
      }
    });
    const scale_val = 0.8;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (configLoading || loading) {
    return <div>Loading...</div>;
  } else {
    console.log("Checking pageOptions... : ", pageOptions);
    console.log("Checking closer.. : ", pageOptions[0])
    return (
      // <Grommet theme={commonTheme} themeMode={darkMode ? "dark" : "light"} full>
      <Grommet theme={darkMode ? darkTheme : lightTheme} full>
        <Box pad="medium" overflow="scroll" style={{ height: "100vh" }} fill>
          <NavBar
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            header={pageOptions[0]?.header}
          />
          <Box
            pad="medium"
            overflow="scroll"
            style={{ height: "100vh" }}
            responsive
          >
            <Box pad="medium">
              <Header level={2}>{pageOptions[1]?.subheader}</Header>
            </Box>
            <Card pad="15px">
              <Text pad="medium">{pageOptions[2]?.description}</Text>
            </Card>
            <Grid
              columns={{
                count: 2,
                size: ["auto", "auto", "auto"],
                responsive: true,
              }}
              gap="medium"
              margin="medium"
            >
              <Box>
                <Text>Study</Text>
                <Select
                  options={studyOptions.map((option) => option.label)}
                  value={
                    studyOptions.find(
                      (option) => option.value === selectedStudy
                    )?.label
                  }
                  onChange={({ option }) =>
                    setSelectedStudy(
                      studyOptions.find(
                        (studyOption) => studyOption.label === option
                      )?.value
                    )
                  }
                />
              </Box>
              <Box>
                <Text>Subject ID</Text>
                <TextInput
                  placeholder="Subject ID"
                  value={subj}
                  onChange={(event) => setSubj(event.target.value)}
                />
              </Box>
              <Box>
                <Text>Session Type</Text>
                <Select
                  options={sessionOptions.map((option) => option.label)}
                  value={
                    sessionOptions.find((option) => option.value === sesType)
                      ?.label
                  }
                  onChange={({ option }) =>
                    setSesType(
                      sessionOptions.find(
                        (sessionOption) => sessionOption.label === option
                      )?.value
                    )
                  }
                />
              </Box>
              <Box>
                <Text>Task Name</Text>
                <Select
                  options={taskOptions.map((option) => option.label)}
                  value={taskName}
                  onChange={({ option }) => {
                    const selectedOption = taskOptions.find(
                      (taskOption) => taskOption.label === option
                    );
                    setTaskName(option);
                    setSelectedTask(selectedOption.value);
                  }}
                />
              </Box>
              {acqOptions.length > 0 && (
                <Box>
                  <Text>Acquisition</Text>
                  <Select
                    options={acqOptions.map((option) => option.label)}
                    value={
                      acqOptions.find((option) => option.value === selectedAcq)
                        ?.label
                    }
                    onChange={({ option }) =>
                      setSelectedAcq(
                        acqOptions.find(
                          (acqOption) => acqOption.label === option
                        )?.value
                      )
                    }
                  />
                </Box>
              )}
              <Box>
                <Text>Version</Text>
                <Select
                  options={verOptions.map((option) => option.label)}
                  value={
                    verOptions.find((option) => option.value === selectedVer)
                      ?.label
                  }
                  onChange={({ option }) =>
                    setSelectedVer(
                      verOptions.find((verOption) => verOption.label === option)
                        ?.value
                    )
                  }
                />
              </Box>
              <Box align="left">
                <Text>
                  Session Number: {sessionSliderValue}{" "}
                  {sessionSliderValue !== 1 ? "" : ""}
                </Text>
                <RangeInput
                  min={1}
                  max={60}
                  value={sessionSliderValue}
                  onChange={(event) => {
                    setSessionSliderValue(parseInt(event.target.value));
                    setSesNum(parseInt(event.target.value));
                  }}
                />
              </Box>

              <Box align="center">
                <Text>Timer Duration</Text>
                <RangeInput
                  min={1}
                  max={10}
                  value={sliderValue}
                  onChange={(event) =>
                    setSliderValue(parseInt(event.target.value))
                  }
                />
                <Text>
                  {sliderValue} minute{sliderValue !== 1 ? "s" : ""}
                </Text>
              </Box>
              <Box align="center">
                <Box>
                  {timerRunning && (
                    <Text textAlign="center" size="xlarge" weight="bold">
                      {formatTime(timerValue, timerRunning)}
                    </Text>
                  )}
                </Box>
                <Button
                  primary
                  label={isRecording ? "Stop Recording" : "Start Recording"}
                  color={isRecording ? "status-critical" : "status-ok"}
                  onClick={isRecording ? stopRecording : startRecording}
                />
              </Box>
            </Grid>
            <Box>
              <Paragraph size="small" pad="medium">
                Please read the following prompt out loud to the participant
              </Paragraph>

              <Paragraph size="large" pad="medium" wrap>
                {taskPrompt}
              </Paragraph>
            </Box>
          </Box>
        </Box>
      </Grommet>
    );
  }
}

export default App;
