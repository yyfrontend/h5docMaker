<template>
  <label class="lable"><input class="input" type="file" @change="fileChange"></label>
</template>

<style scoped>
  .lable {
    display: block;
    cursor: pointer;
    width: 3em;
    height: 3em;
    background: url("../assets/addpic_large.png") no-repeat;
    background-size: cover;
  }

  .input {
    display: none;
  }
</style>

<script>
import { parseImgToDataUrl, parseDataUrlWithCanvas } from '../util/imgUploadUtils'

export default {
  methods: {
    fileChange (event) {
      let file = event.target.files[0]
      if (file) {
        return parseImgToDataUrl(file)
          .then(dataURL => parseDataUrlWithCanvas(dataURL, {
            size: false,
            crop: false,
            fixIOS: false,
            imgQuality: 0.5
          }))
          .then(dataURL => {
            if (dataURL.length > 2 * 1024 * 1024) {
              this.$message.error('请选择小于2M的文件')
              return
            }
            let img = document.createElement('img')
            img.onload = () => {
              this.$emit('uploaded', {
                'base64': dataURL,
                'width': img.width,
                'height': img.height
              })
            }
            img.src = dataURL
          })
          .catch(error => {
            this.$message.error(error.msg || '加载图片失败')
          })
      }
    }
  }
}
</script>
