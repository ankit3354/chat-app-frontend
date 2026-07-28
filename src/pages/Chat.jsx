import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import {
  Flex,
  Box,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useBreakpointValue,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";

const EndPoint = import.meta.env.VITE_API_URL;

const Chat = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [socket, setSocket] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || {});
    const newSocket = io(EndPoint, {
      auth: { user: userInfo },
    });
    setSocket(newSocket);
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <Flex h="100vh" direction="column">
      {/* Mobile top bar with menu button */}
      {isMobile && (
        <Flex
          h="50px"
          align="center"
          px={3}
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          <IconButton
            icon={<HamburgerIcon />}
            onClick={onOpen}
            aria-label="Open groups"
            variant="ghost"
          />
          <Box ml={3} fontWeight="bold">
            {selectedGroup?.name || "Select a group"}
          </Box>
        </Flex>
      )}

      <Flex flex="1" overflow="hidden">
        {/* Sidebar: fixed on desktop, drawer on mobile */}
        {isMobile ? (
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent maxW="280px">
              <DrawerCloseButton />
              <Sidebar
                setSelectedGroup={(g) => {
                  setSelectedGroup(g);
                  onClose();
                }}
              />
            </DrawerContent>
          </Drawer>
        ) : (
          <Box
            w="300px"
            borderRight="1px solid"
            borderColor="gray.200"
            flexShrink={0}
          >
            <Sidebar setSelectedGroup={setSelectedGroup} />
          </Box>
        )}

        {/* Chat area always visible */}
        <Box flex="1" minW={0}>
          <ChatArea selectedGroup={selectedGroup} socket={socket} />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Chat;
