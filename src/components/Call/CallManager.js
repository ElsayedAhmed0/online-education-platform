"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

const IconPhone = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.08 1.18 2 2 0 012.07 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
);

const IconPhoneOff = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.73 19.73 0 01-3.33-2.67m-2.67-3.34a19.79 19.79 0 01-3.07-8.63A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91" />
        <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
);

const IconMic = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const IconMicOff = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
        <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const IconVideo = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

const IconVideoOff = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const IconCheck = ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const IconX = ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default function CallManager({ currentUser }) {
    const supabase = createClient();
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [callStatus, setCallStatus] = useState("");
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const callIdRef = useRef(null);
    const channelRef = useRef(null);

    /* ── استنى calls جديدة ── */
    useEffect(() => {
        const channel = supabase
            .channel(`incoming-calls-${currentUser.id}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "calls",
                filter: `callee_id=eq.${currentUser.id}`,
            }, async (payload) => {
                const call = payload.new;
                if (call.status !== "pending") return;
                const { data: caller } = await supabase
                    .from("profiles")
                    .select("name, avatar_url")
                    .eq("id", call.caller_id)
                    .single();
                setIncomingCall({ ...call, caller });
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    /* ── cleanup ── */
    const cleanup = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        pcRef.current?.close();
        pcRef.current = null;
        localStreamRef.current = null;
        callIdRef.current = null;
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        setActiveCall(null);
        setIncomingCall(null);
        setCallStatus("");
        setIsMuted(false);
        setIsVideoOff(false);
        setHasRemoteVideo(false);
    }, []);

    /* ── اعمل PeerConnection ── */
    const createPC = useCallback((callId) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        pc.onicecandidate = async ({ candidate }) => {
            if (!candidate) return;
            await supabase.from("call_signals").insert({
                call_id: callId,
                sender_id: currentUser.id,
                type: "ice-candidate",
                payload: { candidate: candidate.toJSON() },
            });
        };

        pc.ontrack = (e) => {
            if (remoteVideoRef.current && e.streams[0]) {
                remoteVideoRef.current.srcObject = e.streams[0];
                setHasRemoteVideo(e.streams[0].getVideoTracks().length > 0);
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") setCallStatus("متصل");
            if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
                endCall(callId);
            }
        };

        return pc;
    }, [currentUser.id]);

    /* ── اشترك في الـ signals ── */
    const subscribeToSignals = useCallback((callId, pc, isCallee = false) => {
        const pendingCandidates = [];

        const channel = supabase
            .channel(`call-signals-${callId}-${currentUser.id}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "call_signals",
                filter: `call_id=eq.${callId}`,
            }, async (payload) => {
                const signal = payload.new;
                if (signal.sender_id === currentUser.id) return;

                if (signal.type === "answer" && !isCallee) {
                    if (pc.signalingState === "have-local-offer") {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.sdp));
                        for (const c of pendingCandidates) {
                            await pc.addIceCandidate(new RTCIceCandidate(c));
                        }
                        pendingCandidates.length = 0;
                    }
                }

                if (signal.type === "offer" && isCallee) {
                    if (pc.signalingState === "stable") {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.sdp));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        await supabase.from("call_signals").insert({
                            call_id: callId,
                            sender_id: currentUser.id,
                            type: "answer",
                            payload: { sdp: answer },
                        });
                    }
                }

                if (signal.type === "ice-candidate") {
                    if (pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.payload.candidate));
                    } else {
                        pendingCandidates.push(signal.payload.candidate);
                    }
                }
            })
            .on("postgres_changes", {
                event: "UPDATE",
                schema: "public",
                table: "calls",
                filter: `id=eq.${callId}`,
            }, (payload) => {
                if (["ended", "rejected"].includes(payload.new.status)) cleanup();
            })
            .subscribe();

        channelRef.current = channel;
    }, [currentUser.id, cleanup]);

    /* ── ابدأ مكالمة ── */
    const startCall = useCallback(async (calleeId, calleeName, conversationId, withVideo = true) => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        // ← أضف السطرين دول الأول
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;

        setCallStatus("جاري الاتصال...");
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const { data: call } = await supabase
            .from("calls")
            .insert({
                conversation_id: conversationId,
                caller_id: currentUser.id,
                callee_id: calleeId,
                status: "pending",
                call_type: withVideo ? "video" : "audio", // ← أضف دي
            })
            .select()
            .single();

        callIdRef.current = call.id;
        setActiveCall({ ...call, calleeName, withVideo });

        const pc = createPC(call.id);
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        subscribeToSignals(call.id, pc, false);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await supabase.from("call_signals").insert({
            call_id: call.id,
            sender_id: currentUser.id,
            type: "offer",
            payload: { sdp: offer },
        });
    }, [currentUser.id, createPC, subscribeToSignals]);

    /* ── قبول المكالمة ── */
    const acceptCall = async () => {
        const call = incomingCall;
        setIncomingCall(null);
        setCallStatus("جاري الاتصال...");

        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;

        // ← اقرأ النوع من الـ call نفسه
        const withVideo = call.call_type !== "audio";
        setActiveCall({ ...call, calleeName: call.caller?.name, withVideo });

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });
        } catch (err) {
            console.warn("Camera failed:", err);
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setActiveCall(prev => ({ ...prev, withVideo: false }));
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        await supabase.from("calls").update({ status: "active" }).eq("id", call.id);
        callIdRef.current = call.id;

        const pc = createPC(call.id);
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        subscribeToSignals(call.id, pc, true);

        const { data: signals } = await supabase
            .from("call_signals")
            .select("*")
            .eq("call_id", call.id)
            .eq("type", "offer")
            .order("created_at", { ascending: false })
            .limit(1);

        if (signals?.length) {
            await pc.setRemoteDescription(new RTCSessionDescription(signals[0].payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await supabase.from("call_signals").insert({
                call_id: call.id,
                sender_id: currentUser.id,
                type: "answer",
                payload: { sdp: answer },
            });
        }
    };
    /* ── رفض المكالمة ── */
    const rejectCall = async () => {
        if (incomingCall) {
            await supabase.from("calls").update({ status: "rejected" }).eq("id", incomingCall.id);
        }
        setIncomingCall(null);
    };

    /* ── إنهاء المكالمة ── */
    const endCall = async (callId) => {
        const id = callId || callIdRef.current;
        if (id) {
            await supabase.from("calls")
                .update({ status: "ended", ended_at: new Date().toISOString() })
                .eq("id", id);
        }
        cleanup();
    };

    const toggleMute = () => {
        const audio = localStreamRef.current?.getAudioTracks()[0];
        if (audio) { audio.enabled = !audio.enabled; setIsMuted(!audio.enabled); }
    };

    const toggleVideo = () => {
        const video = localStreamRef.current?.getVideoTracks()[0];
        if (video) { video.enabled = !video.enabled; setIsVideoOff(!video.enabled); }
    };

    useEffect(() => {
        window.__startCall = startCall;
        return () => delete window.__startCall;
    }, [startCall]);

    if (!incomingCall && !activeCall) return null;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font)", direction: "rtl",
            backdropFilter: "blur(4px)",
        }}>
            {/* ── Incoming Call ── */}
            {incomingCall && !activeCall && (
                <div style={{
                    background: "var(--bg-surface)",
                    borderRadius: "24px", padding: "40px 32px",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", gap: "24px",
                    minWidth: "300px", textAlign: "center",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
                }}>
                    <div style={{
                        width: "80px", height: "80px", borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "32px", fontWeight: 800, color: "#fff",
                        overflow: "hidden",
                        boxShadow: "0 0 0 4px rgba(99,102,241,0.2)",
                    }}>
                        {incomingCall.caller?.avatar_url
                            ? <img src={incomingCall.caller.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : incomingCall.caller?.name?.[0] ?? "؟"}
                    </div>
                    <div>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "6px" }}>
                            {incomingCall.caller?.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                            {incomingCall.call_type === "audio" ? "مكالمة صوتية واردة..." : "مكالمة فيديو واردة..."}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "24px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                            <button onClick={rejectCall} style={{
                                width: "64px", height: "64px", borderRadius: "50%",
                                background: "#EF4444", border: "none", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 16px rgba(239,68,68,0.4)",
                            }}>
                                <IconX size={28} color="#fff" />
                            </button>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>رفض</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                            <button onClick={acceptCall} style={{
                                width: "64px", height: "64px", borderRadius: "50%",
                                background: "#10B981", border: "none", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 16px rgba(16,185,129,0.4)",
                            }}>
                                <IconCheck size={28} color="#fff" />
                            </button>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>قبول</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Active Call ── */}
            {activeCall && (
                <div style={{
                    width: "100%", maxWidth: "860px",
                    background: "#0f0f0f",
                    borderRadius: "20px", overflow: "hidden",
                    display: "flex", flexDirection: "column",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "14px 20px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "rgba(255,255,255,0.04)",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                                width: "36px", height: "36px", borderRadius: "50%",
                                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "14px", fontWeight: 800, color: "#fff",
                            }}>
                                {activeCall.calleeName?.[0] ?? "؟"}
                            </div>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                                    {activeCall.calleeName}
                                </div>
                                <div style={{ fontSize: "11px", color: "#aaa", display: "flex", alignItems: "center", gap: "5px" }}>
                                    {callStatus === "متصل" && (
                                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                                    )}
                                    {callStatus || "جاري الاتصال..."}
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                            {activeCall.withVideo ? "مكالمة فيديو" : "مكالمة صوتية"}
                        </div>
                    </div>

                    {/* Videos */}
                    <div style={{ position: "relative", background: "#000", height: "480px" }}>
                        {/* Remote video */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay playsInline
                            style={{
                                width: "100%", height: "100%", objectFit: "cover",
                                display: hasRemoteVideo ? "block" : "none",
                            }}
                        />
                        {/* Placeholder لو مفيش remote video */}
                        {!hasRemoteVideo && (
                            <div style={{
                                position: "absolute", inset: 0,
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center", gap: "16px",
                                background: "#111",
                            }}>
                                <div style={{
                                    width: "96px", height: "96px", borderRadius: "50%",
                                    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "40px", fontWeight: 800, color: "#fff",
                                }}>
                                    {activeCall.calleeName?.[0] ?? "؟"}
                                </div>
                                <div style={{ color: "#aaa", fontSize: "14px" }}>
                                    {callStatus === "متصل" ? "الكاميرا مغلقة" : "جاري الاتصال..."}
                                </div>
                            </div>
                        )}
                        {/* Local video (pip) */}
                        <div style={{
                            position: "absolute", bottom: "16px", left: "16px",
                            width: "180px", height: "110px",
                            borderRadius: "12px", overflow: "hidden",
                            border: "2px solid rgba(99,102,241,0.8)",
                            background: "#1a1a1a",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                        }}>
                            <video
                                ref={localVideoRef}
                                autoPlay playsInline muted
                                style={{
                                    width: "100%", height: "100%", objectFit: "cover",
                                    display: isVideoOff ? "none" : "block",
                                    transform: "scaleX(-1)",
                                }}
                            />
                            {isVideoOff && (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <IconVideoOff size={28} color="#666" />
                                </div>
                            )}
                            <div style={{
                                position: "absolute", bottom: "4px", right: "6px",
                                fontSize: "10px", color: "rgba(255,255,255,0.7)",
                                background: "rgba(0,0,0,0.5)", padding: "1px 5px", borderRadius: "4px",
                            }}>أنت</div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div style={{
                        display: "flex", justifyContent: "center", alignItems: "center", gap: "16px",
                        padding: "20px 24px", background: "#0f0f0f",
                    }}>
                        {/* Mute */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                            <button onClick={toggleMute} style={{
                                width: "56px", height: "56px", borderRadius: "50%",
                                background: isMuted ? "#EF4444" : "rgba(255,255,255,0.1)",
                                border: `1.5px solid ${isMuted ? "#EF4444" : "rgba(255,255,255,0.15)"}`,
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all .2s",
                            }}>
                                {isMuted ? <IconMicOff size={22} color="#fff" /> : <IconMic size={22} color="#fff" />}
                            </button>
                            <span style={{ fontSize: "11px", color: "#888" }}>{isMuted ? "كتم" : "صوت"}</span>
                        </div>

                        {/* Video toggle */}
                        {activeCall.withVideo && (
                            <div style={{ position: "absolute", bottom: "16px", left: "16px" }}>
                                <button onClick={toggleVideo} style={{
                                    width: "56px", height: "56px", borderRadius: "50%",
                                    background: isVideoOff ? "#EF4444" : "rgba(255,255,255,0.1)",
                                    border: `1.5px solid ${isVideoOff ? "#EF4444" : "rgba(255,255,255,0.15)"}`,
                                    cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all .2s",
                                }}>
                                    {isVideoOff ? <IconVideoOff size={22} color="#fff" /> : <IconVideo size={22} color="#fff" />}
                                </button>
                                <span style={{ fontSize: "11px", color: "#888" }}>{isVideoOff ? "كاميرا مغلقة" : "كاميرا"}</span>
                            </div>
                        )}

                        {/* End call */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                            <button onClick={() => endCall()} style={{
                                width: "64px", height: "64px", borderRadius: "50%",
                                background: "#EF4444", border: "none", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 16px rgba(239,68,68,0.4)",
                                transition: "all .2s",
                            }}>
                                <IconPhoneOff size={24} color="#fff" />
                            </button>
                            <span style={{ fontSize: "11px", color: "#888" }}>إنهاء</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.85); }
                }
            `}</style>
        </div>
    );
}