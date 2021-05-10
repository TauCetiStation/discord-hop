'use strict';

const winston = require('winston');

let logger;

module.exports = function (logsPath) {
    if (!logger) {
        console.debug('intializing logger...');
        init(logsPath);
        console.debug('logger initialized');
    }
    return logger;
};

function init(logsPath) {
    logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.File({ filename: logsPath }),
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }),
        ],
    });
}
