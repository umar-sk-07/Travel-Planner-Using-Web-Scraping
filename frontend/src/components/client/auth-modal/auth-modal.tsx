"use client";
import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Link,
} from "@nextui-org/react";
import { Architects_Daughter } from "next/font/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { USER_API_ROUTES } from "@/utils/api-routes";
import { useAppStore } from "@/store";
import axios from "axios";

const ArchitectsDaughter = Architects_Daughter({
  weight: "400",
  style: "normal",
  subsets: ["latin"],
});

const AuthModal = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpen?: () => void;
  onOpenChange: () => void;
}) => {
  const [modalType, setModalType] = useState<"login" | "signup">("login");
  const router = useRouter();
  const { setUserInfo } = useAppStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleSignup = async (onClose: () => void) => {
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(USER_API_ROUTES.SIGNUP, {
        firstName,
        lastName,
        email,
        password,
      });
      if (response.data.userInfo) {
        setUserInfo(response.data.userInfo);
        resetForm();
        onClose();
        router.refresh();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Signup failed. Please try again.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (onClose: () => void) => {
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(USER_API_ROUTES.LOGIN, {
        email,
        password,
      });
      if (response.data.userInfo) {
        setUserInfo(response.data.userInfo);
        resetForm();
        onClose();
        router.refresh();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Login failed. Please try again.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchModalType = () => {
    setModalType((prev) => (prev === "login" ? "signup" : "login"));
    resetForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      backdrop="blur"
      className="bg-opacity-50 bg-purple-200 -z-50"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 capitalize text-3xl items-center">
              {modalType}
            </ModalHeader>
            <ModalBody className="flex flex-col items-center w-full justify-center">
              <div className="">
                <Image
                  src="/logo.png"
                  alt="logo"
                  height={80}
                  width={80}
                  className="cursor-pointer"
                  onClick={() => router.push("/")}
                />
                <span className="text-xl uppercase font-medium italic">
                  <span className={ArchitectsDaughter.className}>HYPED JOURNEY</span>
                </span>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {modalType === "signup" && (
                  <>
                    <Input
                      placeholder="First Name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                      placeholder="Last Name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </>
                )}
                <Input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}
              </div>
            </ModalBody>

            <ModalFooter className="flex flex-col gap-2 items-center justify-center">
              <Button
                color="primary"
                isLoading={loading}
                onPress={() =>
                  modalType === "login"
                    ? handleLogin(onClose)
                    : handleSignup(onClose)
                }
                className="w-full capitalize"
              >
                {modalType}
              </Button>
              {modalType === "signup" ? (
                <p>
                  Already have an account?&nbsp;
                  <Link className="cursor-pointer" onClick={switchModalType}>
                    Login Now
                  </Link>
                </p>
              ) : (
                <p>
                  Don&apos;t have an account?&nbsp;
                  <Link className="cursor-pointer" onClick={switchModalType}>
                    Signup Now
                  </Link>
                </p>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;
