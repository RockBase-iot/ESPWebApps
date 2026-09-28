# OpenDisplay

[OpenDisplay](https://opendisplay.org/) is an open-source, **BLE-first** e-paper ecosystem: a phone, computer, or Home Assistant host connects directly to the display — no dedicated 802.15.4 access point required. The firmware, browser tooling, and Home Assistant integration are all open source.

RockBase IoT has ported OpenDisplay to the NM-EPD-420-4C (ESP32-S3 + 4.2" four-color B/W/R/Y e-paper, 400×300). The port lives on the `nm-epd-420` branch of [RockBase-iot/OpenDisplay-Firmware](https://github.com/RockBase-iot/OpenDisplay-Firmware), using the `EP42YR_400x300` panel class (Good Display 4.2" four-color family: GDEY0420F51 / GDEM042F52).

Firmware package for ESP web flashing.

## Layout

- manifest.json
- assets/logo.png
- assets/product.png
- v1.0.0/nm-epd-420-4c/firmware.bin

## Notes

- Update homepage, product link, and assets before publishing.
- Replace placeholder firmware.bin with real build output.
