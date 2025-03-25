/* global path */
'use strict'

document.addEventListener('DOMContentLoaded', function () {
  submitStatus()

  document.body.addEventListener('click', function (event) {
    if (event.target.matches('button#submit')) {
      submitToVault()
    }
  })
})

async function submitStatus () {
  const status = await getStatus()
  const submitButton = document.getElementById('submit')
  submitButton.disabled = !status
}

async function getStatus () {
  try {
    const status = await Yoda.call('deposit_status', { path })
    const dataCheck = document.getElementById('data_check')
    const metadataCheck = document.getElementById('metadata_check')

    if (status.data) {
      // Retrieve system metadata of folder.
      Yoda.call('research_system_metadata', { coll: Yoda.basePath + path }).then((data) => {
        document.querySelector('.package-size').textContent = data['Package size']
      })
      dataCheck.classList.remove('fa-times', 'text-danger')
      dataCheck.classList.add('fa-check', 'text-success')
    } else {
      dataCheck.classList.remove('fa-check', 'text-success')
      dataCheck.classList.add('fa-times', 'text-danger')
    }

    if (status.metadata) {
      metadataCheck.classList.remove('fa-times', 'text-danger')
      metadataCheck.classList.add('fa-check', 'text-success')
    } else {
      metadataCheck.classList.remove('fa-check', 'text-success')
      metadataCheck.classList.add('fa-times', 'text-danger')
    }

    return status.data && status.metadata
  } catch (e) {
    console.log(e)
    return false
  }
}

async function submitToVault () {
  try {
    const result = await Yoda.call('deposit_submit', { path }, { rawResult: true })
    if (result.status === 'ok') {
      window.location.href = '/deposit/thank-you'
    }
  } catch (e) {
    console.log(e)
  }
}
