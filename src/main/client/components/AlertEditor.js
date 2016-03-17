import React from 'react'

import { Grid, Row, Col, ButtonGroup, Button, Input, Panel } from 'react-bootstrap'
import DateTimeField from 'react-bootstrap-datetimepicker'

import AffectedEntity from './AffectedEntity'
import GtfsMapSearch from '../gtfs/gtfsmapsearch'
import GtfsSearch from '../gtfs/gtfssearch'
import GlobalGtfsFilter from '../containers/GlobalGtfsFilter'


var causes = [
  'UNKNOWN_CAUSE',
  'TECHNICAL_PROBLEM',
  'STRIKE',
  'DEMONSTRATION',
  'ACCIDENT',
  'HOLIDAY',
  'WEATHER',
  'MAINTENANCE',
  'CONSTRUCTION',
  'POLICE_ACTIVITY',
  'MEDICAL_EMERGENCY',
  'OTHER_CAUSE'
]

var effects = [
  'UNKNOWN_EFFECT',
  'NO_SERVICE',
  'REDUCED_SERVICE',
  'SIGNIFICANT_DELAYS',
  'DETOUR',
  'ADDITIONAL_SERVICE',
  'MODIFIED_SERVICE',
  'STOP_MOVED',
  'OTHER_EFFECT'
]

export default class AlertEditor extends React.Component {

  render () {
    console.log(this.props.alert)
    return (
      <div>
        <Grid>
          <Row>
            <Col xs={4}>
              <Input
                type="text"
                label="Title"
                defaultValue={this.props.alert.title}
                onChange={evt => this.props.titleChanged(evt.target.value)}
              />
            </Col>
            <Col xs={5}>
              <Row>
                <Col xs={6}>
                  <div style={{marginBottom: '5px'}}><strong>Start</strong></div>
                  <DateTimeField
                    dateTime={this.props.alert.start}
                    onChange={time => this.props.startChanged(time)} />
                </Col>
                <Col xs={6}>
                  <div style={{marginBottom: '5px'}}><strong>End</strong></div>
                  <DateTimeField
                    dateTime={this.props.alert.end}
                    onChange={time => this.props.endChanged(time)} />
                </Col>
              </Row>
            </Col>

            <Col xs={3}>
              <ButtonGroup className='pull-right'>
                <Button onClick={(evt) => {
                  if(this.props.alert.affectedEntities == 0) {
                    alert("You must add at least one Service Entity")
                    return
                  }
                  var json = {
                    Id: null,
                    HeaderText: this.props.alert.title || 'New Alert',
                    DescriptionText: this.props.alert.description || '',
                    Url: this.props.alert.url || '',
                    Cause: this.props.alert.cause || 'UNKNOWN_CAUSE',
                    Effect: this.props.alert.effect || 'UNKNOWN_EFFECT',
                    Published: 'No',
                    StartDateTime: this.props.alert.start/1000 || 0,
                    EndDateTime: this.props.alert.end/1000 || 0,
                    ServiceAlertEntities: this.props.alert.affectedEntities.map((entity) => {
                      console.log('ent', entity)
                      return {
                        Id: entity.id,
                        AlertId: this.props.alert.id,
                        AgencyId: entity.agency ? entity.agency.defaultGtfsId : null,
                        RouteId: entity.route ? entity.route.route_id : null,
                        RouteType: entity.mode ? entity.mode.gtfsType : null,
                        StopId: entity.stop ? entity.stop.stop_id : null,
                        TripId: null,
                        ServiceAlertTrips: []
                      }
                    })
                  }

                  console.log('saving', this.props.alert.id, json)
                  fetch('http://mtcqa.civicresource.net/api/ServiceAlert/'+(this.props.alert.id < 0 ? '' : this.props.alert.id), {
                    method: this.props.alert.id < 0 ? 'post' : 'put',
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(json)
                  }).then((res) => {
                    console.log('status='+res.status)
                    console.log(res.json());
                    window.location.reload()
                  })

                }}>Save</Button>
                <Button onClick={(evt) => {
                  this.props.onPublishClick(this.props.alert, !this.props.alert.published)
                }}>
                  {this.props.alert.published ? 'Unpublish' : 'Publish'}</Button>
                <Button onClick={(evt) => this.props.onDeleteClick(this.props.alert)}>Delete</Button>
              </ButtonGroup>
            </Col>
          </Row>
          <Row>
            <Col xs={6}>

              <Row>
                <Col xs={6}>
                  <Input
                    type="select"
                    label="Cause"
                    onChange={(evt) => this.props.causeChanged(evt.target.value)}
                    value={this.props.alert.cause}
                  >
                    {causes.map((cause) => {
                      return <option value={cause}>{cause}</option>
                    })}
                  </Input>
                </Col>
                <Col xs={6}>
                  <Input
                    type="select"
                    label="Effect"
                    onChange={(evt) => this.props.effectChanged(evt.target.value)}
                    value={this.props.alert.effect}
                  >
                    {effects.map((effect) => {
                      return <option value={effect}>{effect}</option>
                    })}
                  </Input>
                </Col>
              </Row>

              <Row>
                <Col xs={12}>
                  <Input
                    type="textarea"
                    label="Description"
                    placeholder="Detailed description of alert..."
                    defaultValue={this.props.alert.description}
                    onChange={(evt) => this.props.descriptionChanged(evt.target.value)}
                  />
                </Col>
              </Row>

              <Row>
                <Col xs={12}>
                  <Input
                    type="text"
                    label="URL"
                    placeholder="http://511.org/alerts/transit/123"
                    defaultValue={this.props.alert.url}
                    onChange={(evt) => this.props.urlChanged(evt.target.value)}
                  />
                </Col>
              </Row>

              <Row>
                <Col xs={12}>
                  <Panel header={<b>Affected Service</b>}>
                    <Row>
                      <Col xs={12}>
                        <Row style={{marginBottom: '15px'}}>
                          <Col xs={5}>
                            <Button style={{marginRight: '5px'}} onClick={(evt) => this.props.onAddEntityClick('AGENCY', this.props.editableFeeds[0])}>
                              Add Agency
                            </Button>
                            <Button onClick={(evt) => this.props.onAddEntityClick('MODE', {gtfsType: 0, name: 'Tram/LRT'})}>
                              Add Mode
                            </Button>
                          </Col>
                          <Col xs={7}>
                            <GtfsSearch
                              feeds={this.props.editableFeeds}
                              placeholder='Add stop/route'
                              entities={['stops', 'routes']}
                              clearable={true}
                              onChange={(evt) => {
                                console.log('we need to add this entity to the store', evt)
                                if (typeof evt !== 'undefined' && evt !== null){
                                  if (evt.stop)
                                    this.props.onAddEntityClick('STOP', evt.stop)
                                  else if (evt.route)
                                    this.props.onAddEntityClick('ROUTE', evt.route)
                                }
                              }}
                            />
                          </Col>
                        </Row>
                        {this.props.alert.affectedEntities.map((entity) => {
                          return <AffectedEntity
                            entity={entity}
                            key={entity.id}
                            feeds={this.props.editableFeeds}
                            onDeleteEntityClick={this.props.onDeleteEntityClick}
                            entityUpdated={this.props.entityUpdated}
                          />
                        })}
                      </Col>
                    </Row>
                  </Panel>
                </Col>
              </Row>
            </Col>

            <Col xs={6}>
              <GlobalGtfsFilter />
              <GtfsMapSearch
                feeds={this.props.activeFeeds}
                onStopClick={this.props.onStopClick}
                onRouteClick={this.props.onRouteClick}
                popupAction='Add'
              />
            </Col>

          </Row>
        </Grid>
      </div>
    )
  }
}
