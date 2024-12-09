import React, {useRef, useState ,useEffect} from "react";
import usersData from "./users.json";

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);


  useEffect(() => {
   
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      receiveMessage(); // Clear interval when user changes or component unmounts
    }
  }, [selectedUser]);

 

  const selectUser = (user) => {
    setSelectedUser(user);
    if (!messagesMap[user.id]) {
      setMessagesMap((prev) => ({ ...prev, [user.id]: [] }));
    }
  };

  const sendMessage = async () => {
    if (message && message.trim() && selectedUser) {
      const chatId = `${selectedUser.countrycode}${selectedUser.contactno}`; // Construct chatId

      try {
        const response = await fetch("https://api.wazzup24.com/v3/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`, // Replace with your actual API key
          },
          body: JSON.stringify({
            channelId: "dd8e3b60-fbe1-47b6-b63f-b6677a2f5559",
            chatId, 
            chatType: "whatsapp",
            text: message.trim(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Message sent successfully:", data);

          // Update the UI with the sent message
          setMessagesMap((prev) => ({
            ...prev,
            [selectedUser.id]: [
              ...prev[selectedUser.id],
              { type: "sent", text: message.trim() },
            ],
          }));
          setMessage(""); // Clear the input field
        } else {
          const error = await response.json();
          console.error("Failed to send message:", error);
          alert("Error sending message. Check console for details.");
        }
      } catch (err) {
        console.error("Error while sending message:", err);
        alert("Error connecting to the API. Please try again later.");
      }
    } 
    else if(file)
    {
      const chatId = `${selectedUser.countrycode}${selectedUser.contactno}`; 
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8000/aws_upload', {
          method: 'POST',
          body: formData,
        });
    
        const data = await response.json();
        if (response.ok) {
          console.log('File uploaded successfully:', data.url);
        } else {
          console.error('Error uploading file:', data.error);
        }

        // sending file using content_uri
        
        try {
          const response = await fetch("https://api.wazzup24.com/v3/message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`, // Replace with your actual API key
            },
            body: JSON.stringify({
              channelId: "dd8e3b60-fbe1-47b6-b63f-b6677a2f5559",
              chatId, 
              chatType: "whatsapp",
              contentUri:data.url
            }),
          });
  
          if (response.ok) {
            const data = await response.json();
            console.log("Message sent successfully:", data);
  
            // Update the UI with the sent message
            setMessagesMap((prev) => ({
              ...prev,
              [selectedUser.id]: [
                ...prev[selectedUser.id],
                { type: "sent", text: message.trim() },
              ],
            }));
            setFile(null); // Clear the input field
          } else {
            const error = await response.json();
            console.error("Failed to send message:", error);
            alert("Error sending message. Check console for details.");
          }
        } catch (err) {
          console.error("Error while sending message:", err);
          alert("Error connecting to the API. Please try again later.");
        }



      } catch (error) {
        console.error('Error uploading file:', error);
      }

    }
    
    
    else {
      console.log("Please select a user and type a message before sending.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent adding a new line
      sendMessage();
    }
  };


  

  const receiveMessage = async () => {
    if (!selectedUser) {
      console.log("No user selected. Skipping message retrieval.");
      return; // Exit early if no user is selected
    }
  
    const chatId = `${selectedUser.countrycode}${selectedUser.contactno}`;
   
    try {
      const response = await fetch(`http://localhost:8000/api/getMessages/${chatId}`, {
        method: "GET", // Changed from POST to GET
        headers: {
          "Content-Type": "application/json", // Optional for GET requests, usually needed for POST
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
  
      const data = await response.json(); // Assuming API returns the structure you mentioned

      console.log(data);
      // Update the messages map for the selected user
      setMessagesMap((prev) => ({
        ...prev,
        [selectedUser.id]: [
          ...(prev[selectedUser.id] || []), // Existing messages for the user
          ...data ?.map((msg) => ({ type: "received", text: msg.text })), // Map API messages to the required format
        ],
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  


  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };


  
  

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* User List */}
      <div
        style={{ width: "25%", borderRight: "1px solid #ccc", padding: "10px" }}
      >
        <h2>Contacts</h2>
        {usersData.map((user) => (
          <div
            key={user.id}
            style={{
              padding: "10px",
              cursor: "pointer",
              backgroundColor:
                selectedUser?.id === user.id ? "#f0f0f0" : "#fff",
            }}
            onClick={() => selectUser(user)}
          >
            {user.name}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, padding: "10px" }}>
        {selectedUser ? (
          <>
            <h2>{selectedUser.name}</h2>
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "5px",
                height: "80vh",
                overflowY: "auto",
                padding: "10px",
              }}
            >
              {messagesMap[selectedUser.id]?.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    textAlign: msg.type === "sent" ? "right" : "left",
                    margin: "10px 0",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "10px",
                      borderRadius: "5px",
                      backgroundColor:
                        msg.type === "sent" ? "#d1e7dd" : "#f8d7da",
                    }}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", marginTop: "10px" }}>
              <input type="file" onChange={handleFileChange}/>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message "
                ref={inputRef} 
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "5px",
                  resize: "none",
                  minHeight: "50px",
                }}
              />
              <button className="btn btn-primary" onClick={sendMessage} style={{ marginLeft: "10px" }}>
                Send
              </button>
            </div>
          </>
        ) : (
          <h3>Select a user to start chatting</h3>
        )}
      </div>
    </div>
  );
};

export default Chat;
