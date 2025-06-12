import { createLogger, format as _format, transports as _transports } from 'winston';
export default createLogger({
  level: 'info',
  format: _format.combine(
    _format.timestamp(),
    _format.json()
  ),
  transports: [new _transports.Console()],
});