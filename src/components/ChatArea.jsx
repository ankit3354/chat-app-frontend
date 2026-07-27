import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Flex,
  Icon,
  Avatar,
  InputGroup,
  InputRightElement,
  useToast,
} from "@chakra-ui/react";
import { FiSend, FiInfo, FiMessageCircle } from "react-icons/fi";
import UsersList from "./UsersList";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const ChatArea = ({ selectedGroup, socket }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeOutRef = useRef(null);
  const toast = useToast();

  const curUser = JSON.parse(localStorage.getItem("userInfo")) || {};

  useEffect(() => {
    if (selectedGroup && socket) {
      fetchMessages();

      socket.emit("join room", selectedGroup?._id);

      socket.on("message received", (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      });

      socket.on("users in room", (users) => {
        setConnectedUsers(users);
      });

      socket.on("user joined", (user) => {
        setConnectedUsers((prev) => [...prev, user]);
      });

      socket.on("user left", (userId) => {
        setConnectedUsers((prev) =>
          prev.filter((user) => user?._id !== userId),
        );
      });

      socket.on("notification", (notification) => {
        toast({
          title:
            notification?.type === "USER_JOINED" ? "New User" : "Notification",
          description: notification.message,
          status: "info",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      });

      socket.on("user typing", ({ userName }) => {
        setTypingUsers((prev) => new Set(prev).add(userName));
      });

      socket.on("user stop typing", ({ userName }) => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userName);
          return newSet;
        });
      });

      return () => {
        socket.emit("leave room", selectedGroup?._id);
        socket.off("message received");
        socket.off("user in room");
        socket.off("user joined");
        socket.off("user left");
        socket.off("notification");
        socket.off("user typing");
        socket.off("user stop typing");
      };
    }
  }, [selectedGroup, socket, toast]);

  const fetchMessages = async () => {
    const curUser = JSON.parse(localStorage.getItem("userInfo") || {});
    try {
      const token = curUser?.token;
      const { data } = await axios.get(
        `${REACT_APP_API_URL}/api/messages/${selectedGroup?._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // console.log("data", data);
      setMessages(data);
    } catch (error) {
      console.log("Error ", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "an error occured!",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }
    try {
      const token = curUser?.token;
      const { data } = await axios.post(
        `${REACT_APP_API_URL}/api/messages`,
        {
          content: newMessage,
          groupId: selectedGroup?._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      socket.emit("new message", {
        ...data,
        groupId: selectedGroup?._id,
      });
      setMessages([...messages, data]);
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Error Sending Message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping && selectedGroup) {
      setIsTyping(true);
      socket.emit("typing", {
        groupId: selectedGroup?._id,
        userName: curUser?.userName,
      });
    }
    // clear exiting timeout
    if (typingTimeOutRef.current) {
      clearTimeout(typingTimeOutRef.current);
    }

    typingTimeOutRef.current = setTimeout(() => {
      if (selectedGroup) {
        socket.emit("stop typing", {
          groupId: selectedGroup?._id,
        });
      }
      setIsTyping(false);
    }, 2000);
  };

  // format Time
  const handleFormatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // render time indicator
  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;

    const typingUserArray = Array.from(typingUsers);

    return typingUserArray.map((userName) => (
      <Box
        key={userName}
        alignSelf={userName === curUser?.userName ? "flex-start" : "flex-end"}
        maxW={"70%"}
      >
        <Flex
          align="center"
          bg={userName === curUser?.userName ? "blue.50" : "gray.50"}
          p={2}
          borderRadius={"lg"}
          gap="2"
        >
          {userName === curUser?.userName ? (
            <>
              <Avatar size={"xs"} name={userName} />
              <Flex align={"center"} gap={1}>
                <Text fontSize={"sm"} color="gray.500" fontStyle={"italic"}>
                  You are Typing
                </Text>
                <Flex gap={1}>
                  {[1, 2, 3].map((dot) => (
                    <Box
                      key={dot}
                      h="3px"
                      w="3px"
                      borderRadius={"full"}
                      bg={"gray.500"}
                    />
                  ))}
                </Flex>
              </Flex>
            </>
          ) : (
            <>
              <Flex align={"center"} gap={1}>
                <Text fontSize={"sm"} color="gray.500" fontStyle={"italic"}>
                  {userName} is typing
                </Text>
                <Flex gap={1}>
                  {[1, 2, 3].map((dot) => (
                    <Box
                      key={dot}
                      h="3px"
                      w="3px"
                      borderRadius={"full"}
                      bg={"gray.500"}
                    />
                  ))}
                </Flex>
              </Flex>
              <Avatar size={"xs"} name={userName} />
            </>
          )}
        </Flex>
      </Box>
    ));
  };

  return (
    <Flex h="100%" position="relative">
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        bg="gray.50"
        maxW={`calc(100% - 260px)`}
      >
        {selectedGroup ? (
          <>
            {/* Chat Header */}
            <Flex
              px={6}
              py={4}
              bg="white"
              borderBottom="1px solid"
              borderColor="gray.200"
              align="center"
              boxShadow="sm"
            >
              <Icon
                as={FiMessageCircle}
                fontSize="24px"
                color="blue.500"
                mr={3}
              />
              <Box flex="1">
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  {selectedGroup?.name}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {selectedGroup?.description}
                </Text>
              </Box>
              <Icon
                as={FiInfo}
                fontSize="20px"
                color="gray.400"
                cursor="pointer"
                _hover={{ color: "blue.500" }}
              />
            </Flex>
            {/* Messages Area */}
            <VStack
              flex="1"
              overflowY="auto"
              spacing={4}
              align="stretch"
              px={6}
              py={4}
              position="relative"
              sx={{
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  width: "10px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "gray.200",
                  borderRadius: "24px",
                },
              }}
            >
              {messages?.map((message) => (
                <Box
                  key={message._id}
                  alignSelf={
                    message?.sender?._id === curUser._id
                      ? "flex-start"
                      : "flex-end"
                  }
                  maxW="70%"
                >
                  <Flex direction="column" gap={1}>
                    <Flex
                      align="center"
                      mb={1}
                      justifyContent={
                        message?.sender?._id === curUser._id
                          ? "flex-start"
                          : "flex-end"
                      }
                      gap={2}
                    >
                      {message?.sender?._id === curUser._id ? (
                        <>
                          <Avatar size="xs" name={message?.sender?.userName} />
                          <Text fontSize="xs" color="gray.500">
                            You • {handleFormatTime(message.createdAt)}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text fontSize="xs" color="gray.500">
                            {message.sender.username} •{" "}
                            {handleFormatTime(message.createdAt)}
                          </Text>
                          <Avatar size="xs" name={message?.sender?.userName} />
                        </>
                      )}
                    </Flex>

                    <Box
                      bg={
                        message?.sender?._id === curUser._id
                          ? "blue.500"
                          : "white"
                      }
                      color={
                        message?.sender?._id === curUser._id
                          ? "white"
                          : "gray.800"
                      }
                      p={3}
                      borderRadius="lg"
                      boxShadow="sm"
                    >
                      <Text>{message?.content}</Text>
                    </Box>
                  </Flex>
                </Box>
              ))}
              {renderTypingIndicator()}
              <div ref={messagesEndRef} />
            </VStack>
            {/* Message Input */}
            <Box
              p={4}
              bg="white"
              borderTop="1px solid"
              borderColor="gray.200"
              position="relative"
              zIndex="1"
            >
              <InputGroup size="lg">
                <Input
                  value={newMessage}
                  onChange={(e) => handleTyping(e)}
                  placeholder="Type your message..."
                  pr="4.5rem"
                  bg="gray.50"
                  border="none"
                  _focus={{
                    boxShadow: "none",
                    bg: "gray.100",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    colorScheme="blue"
                    borderRadius="full"
                    _hover={{
                      transform: "translateY(-1px)",
                    }}
                    transition="all 0.2s"
                    onClick={handleSendMessage}
                  >
                    <Icon as={FiSend} />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </Box>
          </>
        ) : (
          <>
            <Flex
              h="100%"
              direction="column"
              align="center"
              justify={"center"}
              p={8}
              textAlign={"center"}
            >
              <Icon
                as={FiMessageCircle}
                fontSize={"64px"}
                color="gray.300"
                mb={4}
              />
              <Text
                fontSize={"xl"}
                fontWeight={"medium"}
                color={"gray.500"}
                mb={2}
              >
                Welcome to the Chat
              </Text>
              <Text color={"gray.500"} mb={2}>
                Select the group to Start Chatting.
              </Text>
            </Flex>
          </>
        )}
      </Box>

      {/* UsersList with fixed width */}
      <Box
        width="260px"
        position="sticky"
        right={0}
        top={0}
        height="100%"
        flexShrink={0}
      >
        {selectedGroup && <UsersList users={connectedUsers} />}
      </Box>
    </Flex>
  );
};

export default ChatArea;
