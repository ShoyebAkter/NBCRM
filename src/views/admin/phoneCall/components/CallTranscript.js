import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Select,
  Text,
  Textarea,
} from "@chakra-ui/react";
import axios from "axios";
import Card from "components/card/Card";
import { HSeparator } from "components/separator/Separator";
import { constant } from "constant";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getApi } from "services/api";

const authHeader = () => ({
  Authorization:
    localStorage.getItem("token") || sessionStorage.getItem("token"),
});

const STATUS_COLOR = {
  none: "gray",
  processing: "orange",
  done: "green",
  failed: "red",
};

const CallTranscript = ({ callId, initialData }) => {
  const [call, setCall] = useState(initialData || {});
  const [text, setText] = useState(initialData?.transcript || "");
  const [dirty, setDirty] = useState(false);
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("");
  const [busy, setBusy] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  const status = call?.transcriptStatus || "none";

  const refresh = useCallback(async () => {
    const response = await getApi("api/phoneCall/view/", callId);
    const fresh = response?.data;
    if (fresh && fresh._id) {
      setCall(fresh);
      // Do not overwrite what the person is typing.
      if (!dirtyRef.current) setText(fresh.transcript || "");
    }
  }, [callId]);

  // While the server is transcribing, check again every 5 seconds.
  useEffect(() => {
    if (status !== "processing") return undefined;
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [status, refresh]);

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  const errorMessage = (e, fallback) =>
    e?.response?.data?.message || e?.message || fallback;

  const upload = async () => {
    if (!file) {
      toast.error("Choose a recording file first.");
      return;
    }
    try {
      setBusy(true);
      const form = new FormData();
      form.append("recording", file);
      form.append("language", language);
      await axios.post(
        `${constant?.baseUrl}api/phoneCall/${callId}/recording`,
        form,
        { headers: authHeader() },
      );
      toast.success("Recording uploaded. Transcribing...");
      setFile(null);
      setAudioUrl("");
      setDirty(false);
      await refresh();
    } catch (e) {
      toast.error(errorMessage(e, "Upload failed."));
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    try {
      setBusy(true);
      await axios.post(
        `${constant?.baseUrl}api/phoneCall/${callId}/transcribe`,
        { language },
        { headers: authHeader() },
      );
      await refresh();
    } catch (e) {
      toast.error(errorMessage(e, "Could not start transcription."));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    try {
      setBusy(true);
      await axios.put(
        `${constant?.baseUrl}api/phoneCall/${callId}/transcript`,
        { transcript: text },
        { headers: authHeader() },
      );
      toast.success("Transcript saved");
      setDirty(false);
      await refresh();
    } catch (e) {
      toast.error(errorMessage(e, "Could not save transcript."));
    } finally {
      setBusy(false);
    }
  };

  const loadAudio = async () => {
    try {
      const response = await axios.get(
        `${constant?.baseUrl}api/phoneCall/${callId}/recording`,
        { headers: authHeader(), responseType: "blob" },
      );
      setAudioUrl(URL.createObjectURL(response.data));
    } catch (e) {
      toast.error("Could not load the recording.");
    }
  };

  return (
    <Card>
      <Flex justifyContent="space-between" alignItems="center" mb={3}>
        <Heading size="md">Recording & Transcript</Heading>
        <Badge colorScheme={STATUS_COLOR[status]}>
          {status === "none" ? "No transcript" : status}
        </Badge>
      </Flex>
      <HSeparator />

      <Box mt={4}>
        <Text fontSize="sm" fontWeight="bold" mb={2}>
          Upload a call recording
        </Text>
        <Flex gap={3} wrap="wrap" alignItems="center">
          <Input
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.ogg,.opus,.aac,.amr,.3gp,.webm,.mp4,.flac,.wma"
            maxW="320px"
            pt="6px"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Select
            maxW="200px"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="">Language: auto-detect</option>
            <option value="bn">Bangla</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ur">Urdu</option>
          </Select>
          <Button
            size="sm"
            variant="brand"
            onClick={upload}
            isLoading={busy}
            disabled={!file || status === "processing"}
          >
            Upload & transcribe
          </Button>
        </Flex>
        <Text fontSize="xs" color="gray.500" mt={2}>
          Only record calls when the other person knows the call is recorded.
        </Text>
      </Box>

      {status === "processing" && (
        <Text mt={4} color="orange.500" fontSize="sm">
          Transcribing... long calls can take several minutes. This page
          updates by itself.
        </Text>
      )}

      {status === "failed" && (
        <Box mt={4}>
          <Text color="red.500" fontSize="sm">
            Transcription failed: {call?.transcriptError || "unknown error"}
          </Text>
          {call?.recordingFile && (
            <Button
              mt={2}
              size="sm"
              variant="outline"
              onClick={retry}
              isLoading={busy}
            >
              Try again
            </Button>
          )}
        </Box>
      )}

      {call?.recordingFile && (
        <Box mt={4}>
          <Text fontSize="sm" fontWeight="bold" mb={2}>
            Recording: {call?.recordingName || "saved"}
          </Text>
          {audioUrl ? (
            <audio controls src={audioUrl} style={{ width: "100%" }} />
          ) : (
            <Button size="sm" variant="outline" onClick={loadAudio}>
              Play recording
            </Button>
          )}
          {status === "done" && (
            <Button
              ml={3}
              size="sm"
              variant="outline"
              onClick={retry}
              isLoading={busy}
            >
              Transcribe again
            </Button>
          )}
        </Box>
      )}

      <Box mt={4}>
        <Text fontSize="sm" fontWeight="bold" mb={2}>
          Transcript
          {call?.transcriptLanguage ? ` (${call.transcriptLanguage})` : ""}
        </Text>
        <Textarea
          value={text}
          rows={12}
          placeholder="The transcript appears here. You can also type or correct it by hand."
          onChange={(e) => {
            setText(e.target.value);
            setDirty(true);
          }}
        />
        <Button
          mt={3}
          size="sm"
          variant="brand"
          onClick={save}
          isLoading={busy}
          disabled={!dirty}
        >
          Save transcript
        </Button>
      </Box>
    </Card>
  );
};

export default CallTranscript;
