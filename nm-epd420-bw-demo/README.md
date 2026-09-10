# nm-epd420-bw-demo

RockBase-iot NM-EPD-420-BW e-paper reference demo.

A standalone, open-source ESP-IDF reference project for the RockBase-iot NM-EPD-420-BW ESP32-S3 board. It evaluates the GYE042A87 400x300 black-and-white e-paper panel, SSD1683 driver, audio, Wi-Fi, battery ADC and BOOT/USER buttons through an English on-device UI — an evaluation and driver reference, not a complete product firmware or cloud service.

Highlights:

- 400 x 300 GYE042A87 e-paper display with SSD1683 controller
- Full-screen 1bpp refresh and SSD1683 differential partial refresh
- Display gallery with a lighthouse print and six-step footprint animation
- Wi-Fi RF scan, acoustic speaker/microphone loopback, battery and two-button self-tests
- Device information page for flash, PSRAM, MAC address, peripherals and power
- Long-press DOWN for 3 seconds to clear the panel and shut down
- MIT licensed; Zectrix Lab original copyright and RockBase-IoT contributions

> [!IMPORTANT]
> This firmware targets the **black-and-white NM-EPD-420-BW** hardware. Flashing it replaces the firmware currently installed on the connected device, so confirm the model and serial port first.

- Upstream: <https://github.com/RockBase-iot/nm-epd420-bw-demo>
- Hardware: <https://github.com/RockBase-iot/NM-EPD-420>
- Product: <https://rockbase.shop/products/nm-epd-420>

Firmware package for ESP web flashing.

## Layout

- manifest.json
- assets/logo.svg
- assets/product.png
- v1.0.0/nm-epd-420-bw/bootloader.bin
- v1.0.0/nm-epd-420-bw/partitions.bin
- v1.0.0/nm-epd-420-bw/boot_app0.bin
- v1.0.0/nm-epd-420-bw/firmware.bin

## Flash

Four-file ESP32-S3 layout (see `fileSets.esp32-s3-four` in manifest.json). Flash from the web flasher, or with esptool:

```bash
esptool.py write_flash \
  0x0     v1.0.0/nm-epd-420-bw/bootloader.bin \
  0x8000  v1.0.0/nm-epd-420-bw/partitions.bin \
  0xe000  v1.0.0/nm-epd-420-bw/boot_app0.bin \
  0x10000 v1.0.0/nm-epd-420-bw/firmware.bin
```

Replace the serial port as appropriate (`idf.py -p /dev/ttyACM0 flash monitor` works too, from a full ESP-IDF checkout).
