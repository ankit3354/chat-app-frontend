import {
  Box,
  VStack,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Flex,
  Icon,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { FiLogOut, FiPlus, FiUsers } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

const REACT_APP_API_URL = import.meta.env.VITE_API_URL;

const Sidebar = ({ setSelectedGroup }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newGroupVal, setNewGroupVal] = useState({
    name: "",
    description: "",
  });
  const toast = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [groups, setGroups] = useState([]);
  const [userGroup, setUserGroup] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewGroupVal((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    checkisAdmin();
    fetchAllGroups();
  }, [groups]);

  // Check user isAdmin or not
  function checkisAdmin() {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || {});
    setIsAdmin(userInfo?.isAdmin || false);
  }
  // fetch all groups
  const fetchAllGroups = async () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || {});
    try {
      const token = userInfo?.token;
      const { data } = await axios.get(
        `${REACT_APP_API_URL}/api/groups`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setGroups(data);
      const userGroupInfo = data
        .filter((group) => {
          return group?.members?.some(
            (member) => member?._id === userInfo?._id,
          );
        })
        .map((user) => user?._id);

      setUserGroup(userGroupInfo);
    } catch (error) {
      console.log(error);
    }
  };
  //create groups
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || {});
      const token = userInfo?.token;
      const { data } = await axios.post(
        `${REACT_APP_API_URL}/api/groups`,
        newGroupVal,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast({
        title: "Group created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      setNewGroupVal({ name: "", description: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "an error occured!",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  //join group
  const handleJoinGroup = async (groupId) => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || {});
    const token = userInfo?.token;
    try {
      const { data } = await axios.post(
        `{REACT_APP_API_URL}/api/groups/${groupId}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setSelectedGroup(groups?.find((g) => g?._id === groupId));

      toast({
        title: "Group Joined successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "an error occured!",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  //leave group
  const handleLeaveGroup = async (groupId) => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || {});
    const token = userInfo?.token;
    try {
      const { data } = await axios.post(
        `${REACT_APP_API_URL}/api/groups/${groupId}/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setSelectedGroup(null);
      toast({
        title: "Left Group successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "an error occured!",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  //logout
  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
    toast({
      title: "Logout successfully!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box
      h="100%"
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      width="100%"
      display="flex"
      flexDirection="column"
      position="relative"
    >
      <Flex
        p={4}
        pr={12}
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="white"
        position="sticky"
        top={0}
        zIndex={1}
        backdropFilter="blur(8px)"
        align="center"
        justify="space-between"
      >
        <Flex align="center">
          <Icon as={FiUsers} fontSize="24px" color="blue.500" mr={2} />
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            Groups
          </Text>
        </Flex>
        {isAdmin && (
          <Tooltip label="Create New Group" placement="right">
            <Button
              size="sm"
              colorScheme="blue"
              variant="ghost"
              onClick={onOpen}
              borderRadius="full"
            >
              <Icon as={FiPlus} fontSize="20px" />
            </Button>
          </Tooltip>
        )}
      </Flex>

      <Box flex="1" overflowY="auto" p={4} mb={16}>
        <VStack spacing={3} align="stretch">
          {groups.map((group) => (
            <Box
              key={group._id}
              p={4}
              cursor="pointer"
              borderRadius="lg"
              bg={userGroup.includes(group._id) ? "blue.50" : "gray.50"}
              borderWidth="1px"
              borderColor={
                userGroup.includes(group._id) ? "blue.200" : "gray.200"
              }
              transition="all 0.2s"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "md",
                borderColor: "blue.300",
              }}
            >
              <Flex justify="space-between" align="center">
                <Box
                  onClick={() =>
                    userGroup.includes(group._id) && setSelectedGroup(group)
                  }
                  flex="1"
                >
                  <Flex align="center" mb={2}>
                    <Text fontWeight="bold" color="gray.800">
                      {group.name}
                    </Text>
                    {userGroup.includes(group._id) && (
                      <Badge ml={2} colorScheme="blue" variant="subtle">
                        Joined
                      </Badge>
                    )}
                  </Flex>
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                    {group.description}
                  </Text>
                </Box>
                <Button
                  size="sm"
                  colorScheme={userGroup.includes(group._id) ? "red" : "blue"}
                  variant={userGroup.includes(group._id) ? "ghost" : "solid"}
                  ml={3}
                  _hover={{
                    transform: userGroup.includes(group._id)
                      ? "scale(1.05)"
                      : "none",
                    bg: userGroup.includes(group._id) ? "red.50" : "blue.600",
                  }}
                  transition="all 0.2s"
                  onClick={() => {
                    userGroup.includes(group._id)
                      ? handleLeaveGroup(group._id)
                      : handleJoinGroup(group._id);
                  }}
                >
                  {userGroup.includes(group._id) ? (
                    <Text fontSize="sm" fontWeight="medium">
                      Leave
                    </Text>
                  ) : (
                    <Text fontSize="sm" fontWeight="medium">
                      Join
                    </Text>
                  )}
                </Button>
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>

      <Box
        p={4}
        borderTop="1px solid"
        borderColor="gray.200"
        bg="gray.50"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        width="100%"
      >
        <Button
          onClick={handleLogout}
          variant="ghost"
          colorScheme="red"
          leftIcon={<Icon as={FiLogOut} />}
          _hover={{
            bg: "red.50",
            transform: "translateY(-2px)",
            shadow: "md",
          }}
          transition="all 0.2s"
        >
          Logout
        </Button>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>Create New Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Group Name</FormLabel>
              <Input
                name="name"
                value={newGroupVal.name}
                onChange={(e) => handleChange(e)}
                placeholder="Enter group name"
                focusBorderColor="blue.400"
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Description</FormLabel>
              <Input
                name="description"
                value={newGroupVal.description}
                onChange={(e) => handleChange(e)}
                placeholder="Enter group description"
                focusBorderColor="blue.400"
              />
            </FormControl>

            <Button
              colorScheme="blue"
              mr={3}
              mt={4}
              width="full"
              onClick={(e) => handleCreateGroup(e)}
            >
              Create Group
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Sidebar;
