import { useEffect, useRef } from "react";

export const Receiver = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080/ws');
        
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'receiver'
            }));
        };

        const pc = new RTCPeerConnection();

        // Handle receiving tracks and assigning them to video
        pc.ontrack = (event) => {
            if (videoRef.current) {
                videoRef.current.srcObject = new MediaStream([event.track]);
                videoRef.current.play();
            }
        };

        // Handle incoming WebSocket messages
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                pc.setRemoteDescription(message.sdp).then(() => {
                    pc.createAnswer().then((answer) => {
                        pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({
                            type: 'createAnswer',
                            sdp: answer
                        }));
                    });
                });
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
            }
        };

        // Cleanup on component unmount
        return () => {
            socket.close();
            pc.close();
        };
    }, []);

    return (
        <div>
            <h2>Receiver</h2>
            <video ref={videoRef} autoPlay muted />
        </div>
    );
};
