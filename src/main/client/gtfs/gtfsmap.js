import React, { PropTypes } from 'react'
import $ from 'jquery'

import fetch from 'isomorphic-fetch'

import { Panel, Grid, Row, Col, Button } from 'react-bootstrap'

import { PureComponent, shallowEqual } from 'react-pure-render'

import { Map, Marker, Popup, TileLayer, Polyline, MapControl, GeoJson } from 'react-leaflet'

import config from '../config'

import Select from 'react-select'

export default class GtfsMap extends React.Component {

  constructor(props) {
    super(props)

    const position = [37.779871, -122.426966]
    this.state = {
      stops: [],
      routes: [],
      patterns: [],
      message: '',
      position: position,
      map: {}
    }
  }

  componentDidMount() {
    //console.log(this.props)
  }


  componentWillReceiveProps(nextProps) {
    if(nextProps.feeds.length !== this.props.length) {
      this.refreshGtfsElements(nextProps.feeds)
    }
  }

  render() {
    //console.log(this.props.stops)
    //console.log(this.state.stops)
    const {attribution, centerCoordinates, geojson, markers, transitive, url, zoom} = this.props

    var feedMap = this.props.feeds.reduce((map, obj) => {
      map[obj.id] = obj.shortName !== null ? obj.shortName : obj.name;
      return map;
    }, {})

    const handleSelection = (input) => {
      this.onChange(input)
    }


    const polyline = [
      [37.779871, -122.426966],
      [37.78, -122.426966],
      [37.79, -122.426966],
    ]
    var mapStyle = {
      height: '400px',
      width: '555px'
    // WebkitTransition: 'all', // note the capital 'W' here
    // msTransition: 'all' // 'ms' is the only lowercase vendor prefix
    }
    const layerAddHandler = (e) => {
      if (this.props.stops.length === 1 && typeof e.layer !== 'undefined' && typeof e.layer._popup !== 'undefined'){
        e.layer.openPopup()
      }
    }

    return (
    <div>
      <div>&nbsp;</div>
      <Map
        ref='map'
        style={mapStyle}
        center={this.state.position}
        zoom={13}
        onLeafletZoomend={() => this.refreshGtfsElements()}
        onLeafletMoveend={() => this.refreshGtfsElements()}
        onLeafletLayeradd={layerAddHandler}
        className='Gtfs-Map'
        >
        <TileLayer url='http://{s}.tile.osm.org/{z}/{x}/{y}.png' attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' />
        {this.props.stops.map((stop, index) => {
          if (typeof stop !== 'undefined') {
            return (
              <Marker
                position={[stop.stop_lat, stop.stop_lon]}
                key={`marker-${stop.stop_id}`}
                >
                <Popup>
                  <div>
                    <h3>{stop.stop_name}</h3>
                    <ul>
                      <li><strong>ID:</strong> {stop.stop_id}</li>
                      <li><strong>Agency:</strong> {feedMap[stop.feed_id]}</li>
                      {stop.stop_desc && <li><strong>Desc:</strong> {stop.stop_desc}</li>}
                    </ul>
                    <Button href="#" onClick={() => this.props.onStopClick(stop)}>{this.props.popupAction} {stop.stop_id}</Button>
                  </div>
                </Popup>
              </Marker>
            )
          }
        })}
        {this.state.stops.map((stop, index) => {
          if (typeof stop !== 'undefined') {
            return (
              <Marker
                position={[stop.stop_lat, stop.stop_lon]}
                key={`marker-${stop.stop_id}`}
                >
                <Popup>
                  <div>
                    <h3>{stop.stop_name}</h3>
                    <ul>
                      <li><strong>ID:</strong> {stop.stop_id}</li>
                      <li><strong>Agency:</strong> {feedMap[stop.feed_id]}</li>
                      {stop.stop_desc && <li><strong>Desc:</strong> {stop.stop_desc}</li>}
                    </ul>
                    <Button href="#" onClick={() => this.props.onStopClick(stop)}>{this.props.popupAction} {stop.stop_id}</Button>
                  </div>
                </Popup>
              </Marker>
            )
          }
        })}
        {this.state.patterns.map((pattern, index) => {
          if (typeof pattern !== 'undefined') {
            const route = pattern.associatedRoutes[0]
            const routeName = route.route_short_name !== null ? route.route_short_name : route.route_long_name
            return (
              <GeoJson color={route.route_color !== null ? '#' + route.route_color : 'blue' } data={{type: 'LineString', coordinates: pattern.geometry.coordinates}} >
                <Popup>
                  <div>
                    <h3>{routeName}</h3>
                    <ul>
                      <li><strong>ID:</strong> {route.route_id}</li>
                      <li><strong>Agency:</strong> {feedMap[route.feed_id]}</li>
                    </ul>
                    <Button href="#" onClick={() => this.props.onRouteClick(route)}>{this.props.popupAction} {route.route_id}</Button>
                  </div>
                </Popup>
              </GeoJson>
            )
          }
        })}
      </Map>
    </div>
    )
  }

  refreshGtfsElements(feeds) {
    const feedIds = (feeds || this.props.feeds).map(feed => feed.id)
    const zoomLevel = this.refs['map'].getLeafletElement().getZoom()
    if(feedIds.length === 0 || zoomLevel <= 13) {
      this.setState({ stops : [], patterns : [], routes : [] })
      return
    }
    console.log('ref GTFS', feedIds);
    const bounds = this.refs['map'].getLeafletElement().getBounds()
    const maxLat = bounds.getNorth()
    const maxLng = bounds.getEast()
    const minLat = bounds.getSouth()
    const minLng = bounds.getWest()

    const getStops = fetch(`/api/stops?max_lat=${maxLat}&max_lon=${maxLng}&min_lat=${minLat}&min_lon=${minLng}&feed=${feedIds.toString()}`)
      .then((response) => {
        return response.json()
      })

    const getRoutes = fetch(`/api/routes?max_lat=${maxLat}&max_lon=${maxLng}&min_lat=${minLat}&min_lon=${minLng}&feed=${feedIds.toString()}`)
      .then((response) => {
        return response.json()
      })

    Promise.all([getStops, getRoutes]).then((results) => {
      const stops = results[0]
      const patterns = results[1]
      const routes = patterns.map(p => p.associatedRoutes[0])
      this.setState({ stops, patterns, routes })
    })
  }
}

// class StopPopup extends React.Component {
//   constructor(props) {
//     super(props)

//     this.state = {
//       stop: this.props.stop
//     }
//   }

//   componentDidMount() {
//     // this.fetchUsers()

//   }
//   render() {
//     const stop = this.state.stop
//     return (
//       <Popup>
//         <div>
//           <h3>{stop.stop_name}</h3>
//           <ul>
//             <li><strong>ID:</strong> {stop.stop_id}</li>
//             <li><strong>Agency:</strong> {stop.feed_id}</li>
//             {stop.stop_desc && <li><strong>Desc:</strong> {stop.stop_desc}</li>}
//           </ul>
//           <Button href="#">Create Alert for {stop.stop_id}</Button>
//         </div>
//       </Popup>
//     )
//   }
// }
