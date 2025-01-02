import { useEffect, useRef, useState } from "react";

export const Receiver = () => {

    const socket = new WebSocket("ws://localhost:8080/ws");
    useEffect(() => {
        socket.onopen = () => {
            console.log("Connected to server");
            socket.send(JSON.stringify({type: "receiver"}));
        };
        socket.onmessage = async(event) => {
            const message = JSON.parse(event.data);
            let pc: RTCPeerConnection | null= null;
            if (message.type === "createOffer") {
                pc = new RTCPeerConnection();
                pc.setRemoteDescription(message.sdp);
                pc.onicecandidate = (event) => {
                    console.log(event.candidate);
                    if (event.candidate) {
                        socket?.send(JSON.stringify({type: "iceCandidate", candidate: event.candidate}));
                    }
                }

                pc.ontrack = (track) => {
                    console.log(track)
                }
                const answer =await  pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(JSON.stringify({type: "createAnswer", sdp: answer}));
            }else if (message.type === "iceCandidate") {
                if (pc != null){
                    // @ts-ignore
                    pc.addIceCandidate(message.candidate);
                }
            }
        }
    },[]);

    return <div>
        Receiver
    </div>
};
