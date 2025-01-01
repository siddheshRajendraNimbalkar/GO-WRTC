import React, { useEffect, useRef, useState } from 'react';

const Sender = () => {
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const ws = useRef<WebSocket | null>(null);

    const initiateConn = () => {
        if (ws.current) {
            ws.current.close();
        }

        ws.current = new WebSocket('ws://localhost:8080/ws');

        ws.current.onopen = () => {
            console.log('WebSocket connection established.');
            ws.current?.send(JSON.stringify({ type: 'sender' }));
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);
            // Handle incoming messages
        };

        ws.current.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
            if (event.code !== 1000) { // 1000 indicates a normal closure
                console.log('Attempting to reconnect...');
                setTimeout(initiateConn, 5000); // Attempt to reconnect after 5 seconds
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            ws.current?.close();
        };
    };

    useEffect(() => {
        initiateConn();

        return () => {
            ws.current?.close();
        };
    }, []);

    useEffect(() => {
        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setVideoStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing media devices.', error);
            }
        };

        getMedia();
    }, []);

    return (
        <div>
            <h2>Sender</h2>
            <button onClick={initiateConn}>Send data</button>
            <video ref={videoRef} autoPlay playsInline />
        </div>
    );
};

export default Sender;