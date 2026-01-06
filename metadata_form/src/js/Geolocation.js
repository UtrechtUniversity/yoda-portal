/* eslint-disable react/no-string-refs */
import React from 'react'
import Modal from 'react-modal'
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet'
import L from 'leaflet'
import { EditControl } from 'react-leaflet-draw'

let globalGeoBoxCounter = 0 // Additions for being able to manually add geoBoxes
let globalThis = null

class Geolocation extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      // showModal: false,
      ...props.formData
    }

    this.openModal = this.openModal.bind(this)
    this.handleCloseModal = this.handleCloseModal.bind(this)
    this.handleAfterOpenModal = this.handleAfterOpenModal.bind(this)
    this.handleDrawCreated = this.handleDrawCreated.bind(this)
    this.handleDrawEdited = this.handleDrawEdited.bind(this)
    this.handleDrawDeleted = this.handleDrawDeleted.bind(this)
    this.handleDrawStop = this.handleDrawStop.bind(this)
    this.setFormData = this.setFormData.bind(this)
    this.geoBoxID = globalGeoBoxCounter
    this.showModal = false
    this.mapRef = React.createRef()
    globalGeoBoxCounter++

    this.modalStyle = {
      overlay: {
        backgroundColor: this.props.formContext.colorMode === 'dark' ? '#212529bf' : '#ffffffbf',
        zIndex: 1064
      },
      content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '70%',
        height: '625px',
        backgroundColor: this.props.formContext.colorMode === 'dark' ? '#212529' : '#ffffff',
        border: this.props.formContext.colorMode === 'dark' ? '1px solid #495057' : '1px solid #ced4da'
      }
    }

    this.coordsStyle = {
      backgroundColor: this.props.formContext.colorMode === 'dark' ? '#212529' : '#fff',
      border: this.props.formContext.colorMode === 'dark' ? '1px solid #495057' : '1px solid #ced4da'
    }
  }

  openModal (e) {
    e.preventDefault()

    globalThis = this // @todo: get rid of this dirty trick
    this.showModal = true
    this.setState(this.state)
  }

  handleCloseModal (e) {
    e.preventDefault()

    this.showModal = false
    this.setState(this.state)
  }

  handleAfterOpenModal (e) {
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

    document.querySelectorAll('.geoInputCoords').forEach(function (input) {
      input.addEventListener('input', function () {
        const boxid = input.getAttribute('boxid')

        // Remove earlier markers and rectangle(s)
        map.eachLayer(function (layer) {
          if (layer instanceof L.Marker || layer instanceof L.Rectangle) {
            map.removeLayer(layer)
          }
        })

        // only make persistent when correct coordinates are added by user
        const lat0 = Number(document.querySelector(`.geoLat0[boxid='${boxid}']`).value)
        const lng0 = Number(document.querySelector(`.geoLng0[boxid='${boxid}']`).value)
        const lat1 = Number(document.querySelector(`.geoLat1[boxid='${boxid}']`).value)
        const lng1 = Number(document.querySelector(`.geoLng1[boxid='${boxid}']`).value)
        let alertText = ''

        // Validation of coordinates - resetten als dialog wordt heropend
        if (isNaN(lng0)) {
          alertText += ', WEST'
        }
        if (isNaN(lat0)) {
          alertText += ', NORTH'
        }
        if (isNaN(lng1)) {
          alertText += ', EAST'
        }
        if (isNaN(lat1)) {
          alertText += ', SOUTH'
        }

        const alertElement = document.querySelector(`.geoAlert[boxid='${boxid}']`)

        if (alertText) {
          alertElement.innerHTML = 'Invalid coordinates: ' + alertText.substring(2)
        } else {
          alertElement.innerHTML = '' // reset the alert box -> no alert required
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
    })
  }

  fillCoordinateInputs (northBoundLatitude, westBoundLongitude, southBoundLatitude, eastBoundLongitude) {
    document.querySelector('.geoLat0').value = northBoundLatitude
    document.querySelector('.geoLng0').value = westBoundLongitude
    document.querySelector('.geoLat1').value = southBoundLatitude
    document.querySelector('.geoLng1').value = eastBoundLongitude
  }

  handleDrawCreated (e) {
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

  handleDrawEdited (e) {
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

  handleDrawDeleted (e) {
    this.setFormData('northBoundLatitude', undefined)
    this.setFormData('westBoundLongitude', undefined)
    this.setFormData('southBoundLatitude', undefined)
    this.setFormData('eastBoundLongitude', undefined)

    this.fillCoordinateInputs('', '', '', '')
  }

  handleDrawStop (e) {
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
          onAfterOpen={this.handleAfterOpenModal}
          onRequestClose={this.handleCloseModal}
          style={this.modalStyle}
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
                onCreated={this.handleDrawCreated}
                onEdited={this.handleDrawEdited}
                onDeleted={this.handleDrawDeleted}
                onDrawStart={this.handleDrawStop}
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
              <label>North:</label> <input type='text' className='geoInputCoords geoLat0 me-1' style={this.coordsStyle} boxid={this.geoBoxID} disabled={this.props.readonly} />
              <label>West:</label> <input type='text' className='geoInputCoords geoLng0 me-1' style={this.coordsStyle} boxid={this.geoBoxID} disabled={this.props.readonly} />
              <label>South:</label> <input type='text' className='geoInputCoords geoLat1 me-1' style={this.coordsStyle} boxid={this.geoBoxID} disabled={this.props.readonly} />
              <label>East:</label> <input type='text' className='geoInputCoords geoLng1 me-1' style={this.coordsStyle} boxid={this.geoBoxID} disabled={this.props.readonly} />
              <button className='btn btn-outline-secondary float-end' onClick={(e) => { this.handleCloseModal(e) }}>Close</button>
            </div>
          </div>
          <div className='geoAlert' boxid={this.geoBoxID} />
        </Modal>
      </div>
    )
  }
}

export default Geolocation
