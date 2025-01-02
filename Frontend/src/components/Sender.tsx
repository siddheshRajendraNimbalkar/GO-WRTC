import { useEffect, useState } from "react"

export const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080/ws");
        setSocket(socket);
        socket.onopen = () => {
            console.log("Connected to server");
            socket.send(JSON.stringify({type: "sender"}));
        };
    },[])
    const StartVideo = async() => {
        if (!socket) return;
        const pc = new RTCPeerConnection();
        pc.onnegotiationneeded = async() => {
            console.log("negotiationneeded");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({type: "createOffer", sdp: offer}));
        }
        pc.onicecandidate = (event) => {
            console.log(event.candidate);
            if (event.candidate) {
                socket?.send(JSON.stringify({type: "iceCandidate", candidate: event.candidate}));
            }
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "createAnswer") {
                pc.setRemoteDescription(message.sdp);
            } else if (message.type === "iceCandidate") {
                pc.addIceCandidate(message.candidate);
            }
        }

        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        pc.addTrack(stream.getVideoTracks()[0])
    }


    return <div>
        Sender
        <button onClick={StartVideo}>send video</button>
    </div>
}