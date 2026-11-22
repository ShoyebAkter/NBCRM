import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { putApi } from "services/api";

const MIN_LENGTH = 8;

// Own profile: asks for the current password. Admin opening another user: sets a new password directly.
const ChangePassword = ({ userId }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const me = JSON.parse(localStorage.getItem("user"));
  const isSelf = me?._id === userId;
  const isAdmin = me?.role === "superAdmin";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isSelf && !isAdmin) return null;

  const close = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  const save = async () => {
    if (newPassword.length < MIN_LENGTH) {
      toast.error(`New password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("The two new passwords do not match.");
      return;
    }
    setSaving(true);
    const response = isSelf
      ? await putApi("api/user/change-password", {
          currentPassword,
          newPassword,
        })
      : await putApi(`api/user/reset-password/${userId}`, { newPassword });
    setSaving(false);

    if (response?.status === 200) {
      toast.success("Password changed");
      close();
    } else {
      toast.error(
        response?.response?.data?.message || "Could not change the password.",
      );
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={onOpen}>
        {isSelf ? "Change password" : "Reset password"}
      </Button>
      <Modal isOpen={isOpen} onClose={close} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isSelf ? "Change your password" : "Set a new password for this user"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isSelf && (
              <FormControl mb={3}>
                <FormLabel>Current password</FormLabel>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </FormControl>
            )}
            <FormControl mb={3}>
              <FormLabel>New password</FormLabel>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Confirm new password</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </FormControl>
            <Text fontSize="xs" color="gray.500" mt={2}>
              At least {MIN_LENGTH} characters.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={close}>
              Cancel
            </Button>
            <Button variant="brand" onClick={save} isLoading={saving}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ChangePassword;
