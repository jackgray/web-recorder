import React, { useState, useEffect } from "react";
import RecordRTC from "recordrtc";
import NavBar from "./NavBar";
import { lightTheme, darkTheme } from "./themes";
import "bootstrap/dist/css/bootstrap.min.css";
import DateInput from "./DateInput";
// import "./custom.css";

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FileInput,
  Footer,
  Grid,
  Grommet,
  grommet,
  Header,
  Page,
  PageContent,
  PageHeader,
  Text,
  TextArea,
  TextInput,
  Select,
  Paragraph,
  RadioButtonGroup,
  RangeInput,
} from "grommet";

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [filename, setFilename] = useState("");
  const [selectedDateTime, setDateTime] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

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

  // Detect when config resources are available.
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
            // setSelectedStudy(data[0]?.value);
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
            // setSelectedSession(data[0]?.value);
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
            // setSelectedTask(data[0]?.value);
            // setTaskPrompt(data[0]?.prompt);
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
            `Testing loading state (should be false): ${configLoading}`
          );
        })
        .catch((error) => {
          console.error("Error loading options:", error);
        });
    }
  }, [serverEndpoint]);

  // Update changes in form values
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

  // Update countdown
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

  const formatDateTime = (dateTimeString) => {
    const dateTime = new Date(dateTimeString);
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, "0");
    const day = String(dateTime.getDate()).padStart(2, "0");
    // const hours = String(dateTime.getHours()).padStart(2, "0");
    // const minutes = String(dateTime.getMinutes()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  const clearDate = () => {
    setDateTime(null);
  };

  // Generate BIDS file name
  const generateFilename = (
    study,
    subj,
    sesType,
    sesNum,
    task,
    ver,
    acq,
    selectedDateTime
  ) => {
    // Leave date blank if no date is provided and a file is selected for upload
    if (selectedFile !== null && selectedDateTime === null) {
      var datetime = "";
      // Get current date and time if no file is selected for upload
    } else if (selectedFile === null) {
      // setDateTime(null);
      var now = new Date();
      var year = now.getFullYear();
      var month = String(now.getMonth() + 1).padStart(2, "0");
      var day = String(now.getDate()).padStart(2, "0");
      var hours = String(now.getHours()).padStart(2, "0");
      var minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      var datetime = `_date-${year}${month}${day}${hours}${minutes}`;
      console.log("Checking date state: ", selectedDateTime);
      console.log(`Updating date: ${datetime}`);

      // Use and format date from date picker component if date is selected
    } else if (selectedDateTime !== null) {
      console.log(`Updating date: ${selectedDateTime}`);
      var datetime = `_date-${formatDateTime(selectedDateTime)}`;
      console.log(`Formatted date: ${datetime}`);
    }

    setSesNum(String(sesNum).padStart(2, "0"));
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
    )}_ses-${sesType}${sesNum}_task-${task}${verPart}${acqPart}${datetime}_audio`;

    console.log(`Generated new filename: ${filename}`);
    return filename;
  };

  // Update filename on form changes
  useEffect(() => {
    const updatedFilename = generateFilename(
      selectedStudy,
      subj,
      sesType,
      sesNum,
      selectedTask,
      selectedVer,
      selectedAcq,
      selectedDateTime
    );
    setFilename(updatedFilename);
  }, [
    selectedStudy,
    subj,
    sesType,
    sesNum,
    selectedTask,
    selectedVer,
    selectedAcq,
    selectedDateTime,
    selectedFile,
  ]);

  // Package the form data with audio object and filename
  const createFormData = (file) => {
    const formData = new FormData();
    formData.append("audio", file, filename);
    // Additional form data if needed
    formData.append("subj", subj);
    formData.append("ses_type", sesType);
    formData.append("ses_num", String(sesNum).padStart(2, "0"));
    formData.append("study", selectedStudy);
    formData.append("task", selectedTask);
    formData.append("acq", selectedAcq);
    formData.append("ver", selectedVer);

    return formData;
  };

  // Send file to server
  const uploadAudio = async (formData) => {
    try {
      console.log("Uploading audio file to server (/uploads)");

      fetch(`${serverEndpoint}/uploads`, {
        method: "POST",
        body: formData,
      })
        .then((mp3PostRes) => {
          if (mp3PostRes.ok) {
            mp3PostRes.json().then((mp3data) => {
              console.log("fetched json data: ", mp3data);
              const mp3Download = serverEndpoint + mp3data.url;
              console.log("Path to mp3 file: ", mp3Download);

              // Wait for a certain duration before downloading the file
              setTimeout(() => {
                fetch(mp3Download)
                  .then((mp3DownloadRes) => mp3DownloadRes.blob())
                  .then((mp3Blob) => {
                    // Create a browser link to download the MP3 file, then click it
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(mp3Blob);
                    link.download = mp3data.filename;
                    link.click();
                    setAudioLoading(false);
                  })
                  .catch((error) => {
                    console.error("Error fetching the MP3 file:", error);
                  });
              }, 3000);
            });
          } else {
            console.error("Error uploading the audio file.");
          }
        })
        .catch((error) => {
          console.error("Error uploading audio:", error);
        });
    } catch (error) {
      console.log("Could not send audio blob to server: ", error);
    }
  };

  const downloadJSON = async () => {
    try {
      const jsonDownloadRes = await fetch(
        `${serverEndpoint}/transcripts/${filename}.json`
      );
      if (jsonDownloadRes.ok) {
        const jsonBlob = await jsonDownloadRes.blob();
        const jsonUrl = URL.createObjectURL(jsonBlob);

        // Create a link to download the JSON file
        const link = document.createElement("a");
        link.href = jsonUrl;
        link.download = `${filename}.json`;
        link.click();
        setJsonLoading(false);
        console.log("Finished loading transcript");
      } else {
        console.error("Error downloading the JSON file. response.ok false: ", jsonDownloadRes);
      }
    } catch (err) {
      console.error("Error downloading JSON:", err.stack);
    }
  };

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

  // End recording, stop timer and send blob to server
  const stopRecording = async () => {
    setIsRecording(false);
    setTimerRunning(false);
    setTimerValue(sliderValue * 60);
    recorder.stopRecording(async () => {
      const blob = recorder.getBlob();

      const formData = createFormData(blob);

      try {
        setAudioLoading(true);
        await uploadAudio(formData).then(() => {
          try {
            setJsonLoading(true);
            // JSON DOWNLOAD
            // Call the downloadJSON function after 10 minutes
            const timeout = setTimeout(() => {
              downloadJSON();

              const interval = setInterval(downloadJSON, 5000);

              // Call the downloadJSON function every 5 seconds for the next 10 minutes
              const checkJsonLoading = setInterval(() => {
                if (!jsonLoading) {
                  clearInterval(timeout);
                  clearInterval(interval);
                  clearInterval(checkJsonLoading);
                }
              }, 100);

              setTimeout(() => {
                clearInterval(interval);
                clearInterval(checkJsonLoading);
              }, 600000); // Stop after 10 minutes (10 minutes = 10 * 60 * 1000 milliseconds)
            }, 600000); // Wait 10 minutes (10 minutes = 10 * 60 * 1000 milliseconds)
          } catch (err) {
            console.error("Error uploading audio:", err.stack);
          }
        });
      } catch (error) {
        console.error("Error uploading audio file: ", error);
      }
    });
  };

  const handleUpload = async () => {
    if (selectedFile) {
      const formData = createFormData(selectedFile);
      console.log("Uploading file:", selectedFile);
      setUploading(true);
      await uploadAudio(formData);
      setUploading(false);
      setSelectedFile(null);
    } else {
      console.log("No file selected.");
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (configLoading || loading) {
    return <div>Loading...</div>;
  } else {
    return (
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
            style={{ height: "95vh" }}
            responsive
          >
            <Grid pad="medium" flex="grow" responsive>
              <Box pad="small" responsive>
                <Text>{pageOptions[1].subheader}</Text>
              </Box>
              <Box responsive>
                <Text wordBreak="break-word" pad="small" responsive>
                  {pageOptions[2].description}
                </Text>
              </Box>
            </Grid>
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
              <Box align="left" padding="xsmall">
                <Text>
                  Session Number: {sessionSliderValue}{" "}
                  {sessionSliderValue !== 1 ? "" : ""}
                </Text>
                <RangeInput
                  min={1}
                  max={15}
                  value={sessionSliderValue}
                  onChange={(event) => {
                    setSessionSliderValue(parseInt(event.target.value));
                    setSesNum(parseInt(event.target.value));
                  }}
                />
                <RadioButtonGroup
                  name="Post Treatment Follow-ups"
                  direction="row"
                  options={["1mo", "3mo", "6mo", "9mo", null]}
                  value={sesNum}
                  onChange={(event) => setSesNum(event.target.value)}
                />
                <Text size="xxsmall">Post-Treatment Follow-ups</Text>
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
            </Grid>
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
                <Paragraph size="small" pad="small">
                  Please read the following prompt out loud to the participant
                </Paragraph>

                <Paragraph size="medium" pad="small" responsive={true}>
                  {taskPrompt}
                </Paragraph>
              </Box>
            </Grid>
            <Grid
              columns={{
                count: 2,
                size: ["auto", "auto", "auto"],
                responsive: true,
              }}
              gap="medium"
              margin="medium"
            >
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
            <Grid>
              <Text>Generated filename</Text>
              <TextArea
                placeholder={filename}
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
              />
            </Grid>

            <Box flex="true" padding="medium">
              <Text padding="medium">Or, upload a file</Text>

              <Grid
                columns={{
                  count: 2,
                  size: ["auto", "auto", "auto"],
                  responsive: true,
                }}
                gap="small"
                margin="small"
                pad="large"
              >
                <Box>
                  <FileInput
                    name="file"
                    onChange={(event) => {
                      const fileList = event.target.files;
                      const uploadAudio = fileList[0];
                      setSelectedFile(uploadAudio);
                    }}
                  />
                  <Button
                    label={
                      uploading
                        ? "Transferring..."
                        : selectedFile
                        ? "Upload"
                        : "Select a File"
                    }
                    onClick={handleUpload}
                  />
                </Box>
                <Box direction="row">
                  <DateInput
                    format="mm/dd/yyyy"
                    value={selectedDateTime}
                    onDateChange={(value) => {
                      setDateTime(value);
                      console.log(`Setting date: ${selectedDateTime}`);
                      console.log(`Sanity check from event.value: ${value}`);
                    }}
                  />
                  <Button label={"Clear"} onClick={clearDate} />
                </Box>
              </Grid>
            </Box>
          </Box>
        </Box>
        <Footer background="brand" pad="small">
          <Text>powered by the NARC Lab at Mount Sinai</Text>
        </Footer>
      </Grommet>
    );
  }
}

export default App;
