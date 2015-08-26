import socketIo = require('socket.io');
import express = require("express");
import http = require('http');

export function register(app: http.Server) {
    let io = socketIo(app);

    io.on('connection', function(socket) {
        socket.emit('news', { hello: 'world' });
        socket.on('my other event', function(data) {
            console.log(data);
        });
    });
}