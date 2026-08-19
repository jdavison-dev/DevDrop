# DevDrop 💧
> **Ephemeral, zero-trust cloud file sharing for developers.**

[![DevDrop CI](https://github.com/jdavison-dev/DevDrop/actions/workflows/ci.yml/badge.svg)](https://github.com/jdavison-dev/DevDrop/actions)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![AWS S3](https://img.shields.io/badge/AWS-S3_Presigned_URLs-orange)

<p center="align">
  <img src=".github/assets/devdrop_demo.gif" alt="DevDrop Demo" width="100%" />
</p>

## Key Features
* **Direct-to-S3 Presigned Streaming:** Bypasses backend server bottlenecks by uploading payloads straight to private AWS S3 buckets.
* **Enforced Single-Use Lifecycle:** MongoDB virtual getters validate download quotas and expiration constraints in real time.
* **Zero-Persistence Gatekeeping:** Restricts link access automatically after lifecycle consumption.