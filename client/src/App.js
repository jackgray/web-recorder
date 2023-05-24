import React, { useState, useEffect } from "react";
import RecordRTC from "recordrtc";
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
import { deepMerge } from "grommet/utils";
import { Moon, Sun, Playfill, Stopfill } from "grommet-icons";

const theme = deepMerge(grommet, {
  global: {
    colors: {
      brand: "#228BE6",
    },
    font: {
      family: "Rajdhani",
      size: "18px", // Adjust the base font size
      height: "2px",
    },
  },
  heading: {
    font: {
      family: "Rajdhani",
      size: "28px",
      height: "30px",
      pad: "20px",
    },
  },
  text: {
    font: {
      family: "Rajdhani",
      size: "16px",
      height: "20px",
    },
  },
  select: {
    control: {
      extend: {
        fontSize: "14px", // Adjust the font size for the Select component
      },
    },
  },
});

const AppBar = (props) => (
  <Header
    background="brand"
    pad={{ left: "medium", right: "small", vertical: "small" }}
    elevation="medium"
    {...props}
  />
);

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
  const [dark, setDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch("/config/serverOptions.json")
      .then((response) => response.json())
      .then((config) => {
        // You have your configuration here
        console.log(`setting server endpoint: ${config.SERVER_ENDPOINT}`)
        setServerEndpoint(config.SERVER_ENDPOINT);
        console.log(`Checking serverEndpoint state: ${serverEndpoint}`)
        console.log(`Checking setServerEndpoint: ${setServerEndpoint}`)
        setIsLoaded(true);
      });
  }, []);

  useEffect(() => {
    console.log(`Checking serverEndpoint state inside config retreival: ${serverEndpoint}`)
    console.log(`Checking setServerEndpoint inside config retrieval: ${setServerEndpoint}`)

    if (serverEndpoint) {
      console.log("serverEndpoint var detected")
      fetch(`${serverEndpoint}/config/studyOptions.json`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch study options");
          }
          console.log(response)
          return response.json();
        })
        .then((data) => {
          setStudyOptions(data);
          setSelectedStudy(data[0]?.value);
        })
        .catch((error) => {
          console.error("Error loading study options:", error);
        });

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
        });

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
        });
    }
  }, [serverEndpoint]);

  useEffect(() => {
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
  }, [selectedTask, taskOptions]);

  useEffect(() => {
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
  }, [selectedTask, selectedVer, taskOptions, verOptions, acqOptions]);

  useEffect(() => {
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
  }, [selectedVer, verOptions]);

  useEffect(() => {
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
  }, [
    selectedTask,
    selectedAcq,
    selectedVer,
    taskOptions,
    acqOptions,
    verOptions,
  ]);

  useEffect(() => {
    let intervalId;
    if (timerRunning) {
      intervalId = setInterval(() => {
        setTimerValue((prevValue) => prevValue - 1);
      }, 1000);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [timerRunning]);

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
      const webfilename=filename+'.webm';
      console.log('using ', webfilename);
      const blob = recorder.getBlob();
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
        const response = await fetch(`${serverEndpoint}/uploads`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (response.ok) {
          const mp3Blob = await response.blob();

          // Create a link to download the MP3 file
          const link = document.createElement("a");
          link.href = URL.createObjectURL(mp3Blob);
          link.download = filename;
          link.click();
        } else {
          console.error("Error uploading the audio file.");
        }
      } catch (err) {
        console.error("Error uploading audio:", err);
      }
    });
    const scale_val = 0.8;
  };

  return (
    <Grommet theme={theme} full>
      <Box
        pad="medium"
        background="light-2"
        overflow="scroll"
        style={{ height: "100vh" }}
      >
        <AppBar>
          <Text size="large">NARC Apps</Text>
          <Button
            icon={dark ? <Moon /> : <Sun />}
            onClick={() => setDark(!dark)}
          />
        </AppBar>
        <Box direction="row" justify="center" pad="medium">
          <Card width="large" height="100vh">
            <CardBody>
              <Box>
                <Box pad="medium">
                  <Header level={2}>NARC Audio Recorder</Header>
                </Box>
                <Card pad="15px">
                  <Text pad="medium">
                    Please fill out every single field, even if it is
                    pre-selected.
                  </Text>
                </Card>
                <Grid
                  margin={{ top: "medium" }}
                  columns={{ count: 2, size: "auto" }}
                  gap="large"
                >
                  <Card>
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
                  </Card>
                  <Card>
                    <Text>Subject ID</Text>
                    <TextInput
                      placeholder="Subject ID"
                      value={subj}
                      onChange={(event) => setSubj(event.target.value)}
                    />
                  </Card>
                  <Card>
                    <Text>Session Type</Text>
                    <Select
                      options={sessionOptions.map((option) => option.label)}
                      value={
                        sessionOptions.find(
                          (option) => option.value === sesType
                        )?.label
                      }
                      onChange={({ option }) =>
                        setSesType(
                          sessionOptions.find(
                            (sessionOption) => sessionOption.label === option
                          )?.value
                        )
                      }
                    />
                  </Card>
                  <Card align="left">
                    <Text>
                      Session Number: {sessionSliderValue}{" "}
                      {sessionSliderValue !== 1 ? "" : ""}
                    </Text>
                    <RangeInput
                      min={1}
                      max={10}
                      value={sessionSliderValue}
                      onChange={(event) => {
                        setSessionSliderValue(parseInt(event.target.value));
                        setSesNum(parseInt(event.target.value));
                      }}
                    />
                    <Text></Text>
                  </Card>
                  <Card>
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
                  </Card>
                  <Card>
                    <Text>Version</Text>
                    <Select
                      options={verOptions.map((option) => option.label)}
                      value={
                        verOptions.find(
                          (option) => option.value === selectedVer
                        )?.label
                      }
                      onChange={({ option }) =>
                        setSelectedVer(
                          verOptions.find(
                            (verOption) => verOption.label === option
                          )?.value
                        )
                      }
                    />
                  </Card>
                  {acqOptions.length > 0 && (
                    <Card>
                      <Text>Acquisition</Text>
                      <Select
                        options={acqOptions.map((option) => option.label)}
                        value={
                          acqOptions.find(
                            (option) => option.value === selectedAcq
                          )?.label
                        }
                        onChange={({ option }) =>
                          setSelectedAcq(
                            acqOptions.find(
                              (acqOption) => acqOption.label === option
                            )?.value
                          )
                        }
                      />
                    </Card>
                  )}
                  <Box>
                    <Paragraph size="small" pad="medium">
                      Please read the following prompt out loud to the
                      participant
                    </Paragraph>

                    <Paragraph size="xlarge" pad="medium" wrap>
                      {taskPrompt}
                    </Paragraph>
                  </Box>

                  <Card align="center">
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
                  </Card>
                  {timerRunning && (
                    <Text textAlign="center" size="xlarge" weight="bold">
                      {formatTime(timerValue, timerRunning)}
                    </Text>
                  )}
                  <Card align="center">
                    <Button
                      primary
                      label={isRecording ? "Stop Recording" : "Start Recording"}
                      color={isRecording ? "status-critical" : "status-ok"}
                      onClick={isRecording ? stopRecording : startRecording}
                    />
                  </Card>
                </Grid>
              </Box>
            </CardBody>
          </Card>
        </Box>
      </Box>
    </Grommet>
  );
}

export default App;
