package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Message struct {
	Type      string `json:"type"`
	SDP       string `json:"sdp"`
	Candidate string `json:"candidate"`
}

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	senderSocket   *websocket.Conn
	receiverSocket *websocket.Conn
)
var mu sync.Mutex

func main() {
	fmt.Println("WebSocket Server is running!")
	r := gin.Default()

	r.GET("/ws", func(ctx *gin.Context) {
		conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
		if err != nil {
			log.Println("Error upgrading connection:", err)
			return
		}
		defer conn.Close()
		log.Println("New WebSocket connection established.")

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				log.Println("Error reading message:", err)
				mu.Lock()
				if conn == senderSocket {
					senderSocket = nil
					log.Println("Sender disconnected.")
				} else if conn == receiverSocket {
					receiverSocket = nil
					log.Println("Receiver disconnected.")
				}
				mu.Unlock()
				break
			}
			log.Println("Received message:", string(msg))
			var message Message
			if err := json.Unmarshal(msg, &message); err != nil {
				log.Println("Error unmarshalling message:", err)
				continue
			}
			switch message.Type {
			case "sender":
				mu.Lock()
				senderSocket = conn
				mu.Unlock()
				log.Println("Sender connected.")
			case "receiver":
				mu.Lock()
				receiverSocket = conn
				mu.Unlock()
				log.Println("Receiver connected.")
			case "createOffer":
				mu.Lock()
				if receiverSocket != nil && senderSocket == conn {
					err := receiverSocket.WriteJSON(msg)
					if err != nil {
						log.Println("Error sending createOffer:", err)
					}
				}
				mu.Unlock()
			case "createAnswer":
				mu.Lock()
				if senderSocket != nil && receiverSocket == conn {
					err := senderSocket.WriteJSON(msg)
					if err != nil {
						log.Println("Error sending createAnswer:", err)
					}
				}
				mu.Unlock()
			case "iceCandidate":
				mu.Lock()
				target := receiverSocket
				if conn == receiverSocket {
					target = senderSocket
				}
				if target != nil {
					err := target.WriteJSON(msg)
					if err != nil {
						log.Println("Error sending ICE candidate:", err)
					}
				}
				mu.Unlock()
			default:
				log.Println("Unknown message type:", message.Type)
			}
		}
	})

	log.Println("WebSocket server is listening on port 8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Error starting server:", err)
	}
}
