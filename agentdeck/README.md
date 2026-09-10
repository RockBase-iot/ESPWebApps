# AgentDeck

**Stop Chatting. Start Steering.**

AgentDeck puts your AI coding agents on a physical control surface. Every key is a session: it shows which agent is running, in which project, and whether it is working, waiting on you, or idle — and it repaints itself as that changes.

This package contains the AgentDeck firmware for the RockBase **NM-EPD-420** 4.2" tri-color e-ink panel (ESP32-S3). It renders the AgentDeck glance face — red ink is spent only on attention — and connects to the AgentDeck daemon over serial or Wi-Fi. See the upstream repository for the full project, including the daemon, Stream Deck / Ulanzi / Android / Apple integrations, and the other 11 supported ESP32 boards.

- Upstream: <https://github.com/puritysb/AgentDeck>
- Project website: <https://puritysb.github.io/AgentDeck/>
- Product: <https://rockbase.shop/products/nm-epd-420>

Firmware package for ESP web flashing.

## Layout

- manifest.json
- assets/logo.svg
- assets/product.jpg
- v1.2.2/nm-epd-420/firmware.bin

## Flash

Single merged application image, written at offset `0x0` on the ESP32-S3 (see `fileSets.single-app` in manifest.json). Flash from the web flasher, or with esptool:

```bash
esptool.py write_flash 0x0 v1.2.2/nm-epd-420/firmware.bin
```
