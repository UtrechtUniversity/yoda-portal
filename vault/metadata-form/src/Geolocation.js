import React, { Component } from 'react'
import { render } from 'react-dom'
import { FieldProps } from '@rjsf/utils'
import Modal from 'react-modal'
import { MapContainer, TileLayer, Marker, FeatureGroup } from 'react-leaflet'
import L from 'leaflet'
import { EditControl } from 'react-leaflet-draw'

let globalGeoBoxCounter = 0 // Additions for being able to manually add geoBoxes
let globalThis = null

const customModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '70%',
    height: '625px'
  }
}

class Geolocation extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      // showModal: false,
      ...props.formData
    }

    this.openModal = this.openModal.bind(this)
    this.closeModal = this.closeModal.bind(this)
    this.afterOpenModal = this.afterOpenModal.bind(this)
    this.drawCreated = this.drawCreated.bind(this)
    this.drawEdited = this.drawEdited.bind(this)
    this.drawDeleted = this.drawDeleted.bind(this)
    this.drawStop = this.drawStop.bind(this)
    this.setFormData = this.setFormData.bind(this)
    this.geoBoxID = globalGeoBoxCounter
    this.showModal = false
    globalGeoBoxCounter++
  }

  openModal (e) {
    e.preventDefault()

    globalThis = this // @todo: get rid of this dirty trick
    this.showModal = true
    this.setState(this.state)
  }

  closeModal (e) {
    e.preventDefault()

    this.showModal = false
    this.setState(this.state)
  }

  afterOpenModal (e) {
    const { northBoundLatitude, westBoundLongitude, southBoundLatitude, eastBoundLongitude } = this.state
    const map = this.refs.map
    if (typeof northBoundLatitude !== 'undefined' &&
            typeof westBoundLongitude !== 'undefined' &&
            typeof southBoundLatitude !== 'undefined' &&
            typeof eastBoundLongitude !== 'undefined'
    ) {
      const bounds = [
        [northBoundLatitude, westBoundLongitude],
        [southBoundLatitude + 0.1, eastBoundLongitude + 0.1]
      ]

      // Coordinates are a point.
      if (northBoundLatitude === southBoundLatitude && westBoundLongitude === eastBoundLongitude) {
        const latlng = L.latLng(northBoundLatitude, westBoundLongitude)
        L.marker(latlng).addTo(map)
      } else {
        L.rectangle(bounds).addTo(map)
      }
      map.fitBounds(bounds, { padding: [150, 150] })
    }

    this.fillCoordinateInputs(northBoundLatitude, westBoundLongitude, southBoundLatitude, eastBoundLongitude)

    $('.geoInputCoords').on('input propertychange paste', function () {
      const boxid = $(this).attr('boxid')

      // Remove earlier markers and rectangle(s)
      map.eachLayer(function (layer) {
        if (layer instanceof L.Marker || layer instanceof L.Rectangle) {
          map.removeLayer(layer)
        }
      })

      // only make persistent when correct coordinates are added by user
      const lat0 = Number($(".geoLat0[boxid='" + boxid + "']").val())
      const lng0 = Number($(".geoLng0[boxid='" + boxid + "']").val())
      const lat1 = Number($(".geoLat1[boxid='" + boxid + "']").val())
      const lng1 = Number($(".geoLng1[boxid='" + boxid + "']").val())
      let alertText = ''

      // Validation of coordinates - resetten als dialog wordt heropend
      if (!$.isNumeric(lng0)) {
        alertText += ', WEST'
      }
      if (!$.isNumeric(lat0)) {
        alertText = ', NORTH'
      }
      if (!$.isNumeric(lng1)) {
        alertText += ', EAST'
      }
      if (!$.isNumeric(lat1)) {
        alertText += ', SOUTH'
      }

      if (alertText) {
        $('.geoAlert[boxid="' + boxid + '"]').html('Invalid coordinates: ' + alertText.substring(2))
      } else {
        $('.geoAlert[boxid="' + boxid + '"]').html('') // reset the alert box -> no alert required
        const bounds = [[lat0, lng0], [lat1 + 0.1, lng1 + 0.1]]

        // Coordinates are a point.
        if (lat0 === lat1 && lng0 === lng1) {
          const latlng = L.latLng(lat0, lng0)
          L.marker(latlng).addTo(map)
        } else {
          L.rectangle(bounds).addTo(map)
        }
        map.fitBounds(bounds, { padding: [150, 150] })

        globalThis.setFormData('northBoundLatitude', lat0)
        globalThis.setFormData('westBoundLongitude', lng0)
        globalThis.setFormData('southBoundLatitude', lat1)
        globalThis.setFormData('eastBoundLongitude', lng1)
      }
    })
  }

  fillCoordinateInputs (northBoundLatitude, westBoundLongitude, southBoundLatitude, eastBoundLongitude) {
    $('.geoLat0').val(northBoundLatitude)
    $('.geoLng0').val(westBoundLongitude)
    $('.geoLat1').val(southBoundLatitude)
    $('.geoLng1').val(eastBoundLongitude)
  }

  drawCreated (e) {
    const layer = e.layer

    if (layer instanceof L.Marker) {
      this.setFormData('northBoundLatitude', layer.getLatLng().lat)
      this.setFormData('westBoundLongitude', layer.getLatLng().lng)
      this.setFormData('southBoundLatitude', layer.getLatLng().lat)
      this.setFormData('eastBoundLongitude', layer.getLatLng().lng)

      this.fillCoordinateInputs(
        layer.getLatLng().lat, layer.getLatLng().lng,
        layer.getLatLng().lat, layer.getLatLng().lng
      )
    } else if (layer instanceof L.Rectangle) {
      this.setFormData('northBoundLatitude', layer.getLatLngs()[0][2].lat)
      this.setFormData('westBoundLongitude', layer.getLatLngs()[0][2].lng)
      this.setFormData('southBoundLatitude', layer.getLatLngs()[0][0].lat)
      this.setFormData('eastBoundLongitude', layer.getLatLngs()[0][0].lng)

      this.fillCoordinateInputs(
        layer.getLatLngs()[0][2].lat, layer.getLatLngs()[0][2].lng,
        layer.getLatLngs()[0][0].lat, layer.getLatLngs()[0][0].lng
      )
    }
  }

  drawEdited (e) {
    e.layers.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.setFormData('northBoundLatitude', layer.getLatLng().lat)
        this.setFormData('westBoundLongitude', layer.getLatLng().lng)
        this.setFormData('southBoundLatitude', layer.getLatLng().lat)
        this.setFormData('eastBoundLongitude', layer.getLatLng().lng)

        this.fillCoordinateInputs(
          layer.getLatLng().lat, layer.getLatLng().lng,
          layer.getLatLng().lat, layer.getLatLng().lng
        )
      } else if (layer instanceof L.Rectangle) {
        this.setFormData('northBoundLatitude', layer.getLatLngs()[0][2].lat)
        this.setFormData('westBoundLongitude', layer.getLatLngs()[0][2].lng)
        this.setFormData('southBoundLatitude', layer.getLatLngs()[0][0].lat)
        this.setFormData('eastBoundLongitude', layer.getLatLngs()[0][0].lng)

        this.fillCoordinateInputs(
          layer.getLatLngs()[0][2].lat, layer.getLatLngs()[0][2].lng,
          layer.getLatLngs()[0][0].lat, layer.getLatLngs()[0][0].lng
        )
      }
    })
  }

  drawDeleted (e) {
    this.setFormData('northBoundLatitude', undefined)
    this.setFormData('westBoundLongitude', undefined)
    this.setFormData('southBoundLatitude', undefined)
    this.setFormData('eastBoundLongitude', undefined)

    this.fillCoordinateInputs('', '', '', '')
  }

  drawStop (e) {
    const map = this.refs.map
    map.eachLayer(function (layer) {
      if (layer instanceof L.Marker || layer instanceof L.Rectangle) {
        map.removeLayer(layer)
      }
    })
  }

  setFormData (fieldName, fieldValue) {
    this.setState({
      [fieldName]: fieldValue
    }, () => this.props.onChange(this.state))
  }

  render () {
    const { northBoundLatitude, westBoundLongitude, southBoundLatitude, eastBoundLongitude } = this.state
    return (
      <div className={'form-group geoDiv' + this.geoBoxID}>
        <div>
          <label>NorthWest: {northBoundLatitude}, {westBoundLongitude}</label>
          <br />
          <label>SouthEast: {southBoundLatitude}, {eastBoundLongitude}</label>
          <button className='btn btn-outline-secondary float-end' type='button' tabindex='-1' onClick={(e) => { this.openModal(e) }}>Open Map</button>
        </div>

        <Modal
          isOpen={this.showModal}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          style={customModalStyles}
          ariaHideApp={false}
        >
          <MapContainer ref='map' center={[48.760, 13.275]} zoom={4} animate={false}>
            <TileLayer
              attribution='&copy; <a href="https://tile.openstreetmap.org/{z}/{x}/{y}.png">OpenStreetMap contributors</a>'
              url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            <FeatureGroup>
              <EditControl
                position='topright'
                onCreated={this.drawCreated}
                onEdited={this.drawEdited}
                onDeleted={this.drawDeleted}
                onDrawStart={this.drawStop}
                draw={{
                  circle: false,
                  polygon: false,
                  circlemarker: false,
                  polyline: false,
                  marker: !this.props.readonly,
                  rectangle: !this.props.readonly
                }}
                edit={{
                  remove: !this.props.readonly
                }}
              />
            </FeatureGroup>
          </MapContainer>

          <div className='row'>
            <div className='col-sm-12 mt-1'>
              <label>North:</label> <input type='text' className='geoInputCoords geoLat0 me-1' boxid={this.geoBoxID} disabled={this.props.readonly} />
              <label>West:</label> <input type='text' className='geoInputCoords geoLng0 me-1' boxid={this.geoBoxID} disabled={this.props.readonly} />
              <label>South:</label> <input type='text' className='geoInputCoords geoLat1' boxid={this.geoBoxID} disabled={this.props.readonly} />
              <label>East:</label> <input type='text' className='geoInputCoords geoLng1 me-1' boxid={this.geoBoxID} disabled={this.props.readonly} />
              <button className='btn btn-outline-secondary float-end' onClick={(e) => { this.closeModal(e) }}>Close</button>
            </div>
          </div>
          <div className='geoAlert' boxid={this.geoBoxID} />
        </Modal>
      </div>
    )
  }
}

export default Geolocation
