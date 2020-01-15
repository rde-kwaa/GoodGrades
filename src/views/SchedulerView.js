import React from 'react';
import Paper from '@material-ui/core/Paper';
import LinearProgress from '@material-ui/core/LinearProgress';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { makeStyles } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core/styles';
import teal from '@material-ui/core/colors/teal';
import { fade } from '@material-ui/core/styles/colorManipulator';
import { ViewState, EditingState } from '../components/dx-react-scheduler';
import {
  AllDayPanel,
  AppointmentForm,
  Appointments,
  AppointmentTooltip,
  ConfirmationDialog,
  CurrentTimeIndicator,
  DateNavigator,
  DayView,
  DragDropProvider,
  EditRecurrenceMenu,
  Scheduler,
  Toolbar,
  WeekView,
  ViewSwitcher,
  TodayButton,
  Resources
} from '@devexpress/dx-react-scheduler-material-ui';
import classNames from 'clsx';
import { IconButton, Grid, Button } from '@material-ui/core';
import MoreIcon from '@material-ui/icons/MoreVert';
import Room from '@material-ui/icons/Room';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';


const useStyles = makeStyles(theme => ({
  line: {
    height: '2px',
    borderTop: `2px ${theme.palette.primary.main} dotted`,
    width: '100%',
    transform: 'translate(0, -1px)'
  },
  circle: {
    width: theme.spacing(1.5),
    height: theme.spacing(1.5),
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    background: theme.palette.primary.main
  },
  nowIndicator: {
    position: 'absolute',
    zIndex: 1,
    left: 0,
    top: ({ top }) => top
  },
  shadedCell: {
    backgroundColor: fade(theme.palette.primary.main, 0.08),
    '&:hover': {
      backgroundColor: fade(theme.palette.primary.main, 0.12)
    },
    '&:focus': {
      backgroundColor: fade(theme.palette.primary.main, 0.2),
      outline: 0
    }
  },
  shadedPart: {
    backgroundColor: fade(theme.palette.primary.main, 0.08),
    position: 'absolute',
    height: ({ shadedHeight }) => shadedHeight,
    width: '100%',
    left: 0,
    top: 0,
    'td:focus &': {
      backgroundColor: fade(theme.palette.primary.main, 0.12)
    }
  },
  appointment: {
    backgroundColor: teal[300],
    '&:hover': {
      backgroundColor: teal[400]
    }
  },
  shadedAppointment: {
    backgroundColor: teal[200],
    '&:hover': {
      backgroundColor: teal[300]
    }
  }
}));

const styles = {
  toolbarRoot: {
    position: 'relative'
  },
  progress: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    left: 0
  }
};

const style = ({ palette }) => ({
  icon: {
    color: palette.action.active,
  },
  textCenter: {
    textAlign: 'center',
  },
  firstRoom: {
    background: 'url(https://js.devexpress.com/Demos/DXHotels/Content/Pictures/Lobby-4.jpg)',
  },
  secondRoom: {
    background: 'url(https://js.devexpress.com/Demos/DXHotels/Content/Pictures/MeetingRoom-4.jpg)',
  },
  thirdRoom: {
    background: 'url(https://js.devexpress.com/Demos/DXHotels/Content/Pictures/MeetingRoom-0.jpg)',
  },
  header: {
    height: '260px',
    backgroundSize: 'cover',
  },
  commandButton: {
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
});




// const ExternalViewSwitcher = ({ currentViewName, onChange }) => (
//   <RadioGroup
//     aria-label='Views'
//     style={{ flexDirection: 'row', paddingLeft: 16 }}
//     name='views'
//     value={currentViewName}
//     onChange={onChange}>
//     <FormControlLabel value='Week' control={<Radio />} label='Week' />
//     <FormControlLabel value='Day' control={<Radio />} label='Day' />
//   </RadioGroup>
// );

const TimeIndicator = ({ top, ...restProps }) => {
  const classes = useStyles({ top });
  return (
    <div {...restProps}>
      <div className={classNames(classes.nowIndicator, classes.circle)} />
      <div className={classNames(classes.nowIndicator, classes.line)} />
    </div>
  );
};

const ToolbarWithLoading = withStyles(styles, { name: 'Toolbar' })(
  ({ children, classes, ...restProps }) => (
    <div className={classes.toolbarRoot}>
      <Toolbar.Root {...restProps}>{children}</Toolbar.Root>
      <LinearProgress className={classes.progress} />
    </div>
  )
);

const mapAppointmentData = (dataToMap, index) => ({
  id: index,
  startDate: dataToMap.start_time,
  endDate: dataToMap.end_time,
  old_start_time: dataToMap.start_time,
  ...dataToMap,
});

const styles2 = theme => ({
  container: {
    display: 'flex',
    marginBottom: theme.spacing(2),
    justifyContent: 'flex-end',
  },
  text: {
    ...theme.typography.h6,
    marginRight: theme.spacing(2),
  },
});


const ResourceSwitcher = withStyles(styles2, { name: 'ResourceSwitcher' })(
  ({
    mainResourceName, onChange, classes, resources,
  }) => (
    <div className={classes.container}>
      <div className={classes.text}>
        Main resource name:
      </div>
      <Select
        value={mainResourceName}
        onChange={e => onChange(e.target.value)}
      >
        {resources.map(resource => (
          <MenuItem key={resource.fieldName} value={resource.fieldName}>
            {resource.title}
          </MenuItem>
        ))}
      </Select>
    </div>
  ),
)

const mapTutorData = (dataToMap, index) => (
  {
  tutor : {
    fieldName: dataToMap.unique_id,
    title: dataToMap.username,
    instances: [],
  },
  events : (dataToMap.events.length > 0) ? dataToMap.events.map(mapAppointmentData) : []
});

export default class SchedulerView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loading: true,
      currentDate: Date.now(),
      currentViewName: 'Week',
      addedAppointment: {},
      appointmentChanges: {},
      editingAppointmentId: undefined,
      mainResourceName: 'selectTutor',
      resources: [ {
        fieldName: 'selectTutor',
        title: 'Select Tutor',
        instances: []
      } ]
    };

    this.loadData = this.loadData.bind(this);
    this.commitChanges = this.commitChanges.bind(this);
    this.changeAddedAppointment = this.changeAddedAppointment.bind(this);
    this.changeAppointmentChanges = this.changeAppointmentChanges.bind(this);
    this.changeEditingAppointmentId = this.changeEditingAppointmentId.bind(
      this
    );
    this.currentDateChange = currentDate => {
      this.setState({ currentDate });
    };
    this.currentViewNameChange = currentViewName => {
      this.setState({ currentViewName });
    };
    this.changeMainResource = this.changeMainResource.bind(this);
  }

  changeMainResource(mainResourceName) {
    let excludedEvents = []
    if (this.state.allEvents) {
      const newEvents = this.state.allEvents.filter(elem => elem.tutor == mainResourceName)
      newEvents.map(elem => {
        const ans = this.state.initialData.filter(elem2 => {  // filtering what data is already showing for tutor initially and removing from currently selected data
          return (elem2.tutor == elem.tutor && elem2.startDate == elem.startDate)
        })
        if (ans.length == 0) { excludedEvents.push(elem) } // if no matching event found in initial data, it is added to excludedEvents array
      })

      console.log("Changed", this.state, newEvents, mainResourceName, excludedEvents)
    }
    this.setState({ 
      mainResourceName,
      data: [...this.state.initialData, ...excludedEvents]
    });
  }

  componentDidMount() {
    this.loadData();
    this.loadAllTutorsData();
  }

  // componentDidUpdate() {
  //   this.loadData();
  // }

  loadData() {
    console.log('fetchin frahm api');
    fetch(
      `https://good-grades-server.herokuapp.com/api/events/byTutor/${this.props.user.unique_id}`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json'
        }
      }
    )
      .then(response => response.json())
      .then(data =>
        setTimeout(() => {
          this.setState({
            data: data ? data.map(mapAppointmentData) : [],
            initialData : data ? data.map(mapAppointmentData) : [], //using to store tutors initial events and compare to selected tutor's events
            loading: false
          });
          console.log("Appoint", this.state.data)
        }, 2200)
      )
      .catch(() => this.setState({ loading: false }));
  }

  loadAllTutorsData() {
    console.log('fetching all tutors and their events');
    fetch(
      `https://good-grades-server.herokuapp.com/api/users/tutor/getAllTutors/events`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json'
        }
      }
    )
      .then(response => response.json())
      .then(data =>
        setTimeout(() => {
          // console.log("Before", data)
          const toMapTutor = data ? data.map(mapTutorData) : [];
          let onlyEvents = [];
          let onlyTutors = toMapTutor.map(element => {
            element.events.map(element2 => {
              onlyEvents.push(element2);
            });
            element = element.tutor
            return element;
          });
          onlyTutors.unshift(...this.state.resources)
          // console.log("DOne", toMapTutor, onlyTutors, onlyEvents)
          this.setState({
            resources: onlyTutors,
            allEvents: onlyEvents,
            // data: onlyEvents,
            loading: false
          });
          console.log("Mapped", this.state)
        }, 2200)
      )
      .catch(() => this.setState({ loading: false }));
  }

  changeAddedAppointment(addedAppointment) {
    this.setState({ addedAppointment });
  }

  changeAppointmentChanges(appointmentChanges) {
    this.setState({ appointmentChanges });
  }

  changeEditingAppointmentId(editingAppointmentId) {
    this.setState({ editingAppointmentId });
  }

  commitChanges({ added, changed, deleted }) {
    this.setState(state => {
      let { data } = state;
      if (added) {
        const startingAddedId =
          data.length > 0 ? data[data.length - 1].id + 1 : 0;
          let newAppointment = { id: startingAddedId, ...added, tutor: this.props.user.unique_id, old_start_time: added.startDate, start_time: added.startDate, end_time: added.endDate};
          data = [...data, newAppointment];
          let test = 
          fetch(
            'https://good-grades-server.herokuapp.com/api/events/createEvent',
            {
              method: 'POST',
              headers: {
                'content-type': 'application/json'
              },
              body:JSON.stringify({
                ...newAppointment
              })
            }
          )
            .then(response => response.json())
            .then(data => data
              // setTimeout(() => {}, 2200)
            )
            .catch(() => console.log("Error"));
          console.log({test})
      }
      if (changed) {
        console.log(changed)
        data = data.map(appointment => {
          if (changed[appointment.id]){
            let changedAppointment = { ...appointment, ...changed[appointment.id], new_start_time: changed[appointment.id].startDate, new_end_time: changed[appointment.id].endDate};
            fetch(
              'https://good-grades-server.herokuapp.com/api/events/updateEvent',
              {
                method: 'POST',
                headers: {
                  'content-type': 'application/json'
                },
                body:JSON.stringify({
                  ...changedAppointment
                })
              }
            )
              .then(response => response.json())
              .then(data => console.log(data)
                // setTimeout(() => {}, 2200)
              )
              .catch(() => console.log("Error"));
            changedAppointment.old_start_time = changedAppointment.new_start_time;
            return changedAppointment
          }
          else{
            return appointment;
          }
        }
        );
      }
      if (deleted !== undefined) {
        fetch(
          'https://good-grades-server.herokuapp.com/api/events/deleteEvent',
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body:JSON.stringify({
              ...data[deleted]
            })
          }
        )
          .then(response => response.json())
          .then(data => console.log(data)
            // setTimeout(() => {}, 2200)
          )
          .catch(() => console.log("Error"));
        console.log(data[deleted])
        data = data.filter(appointment => {console.log(appointment, deleted); return appointment.id !== deleted});
      }
      return { data };
    });
  }

  bookSession(appointmentData){
    console.log({appointmentData})
    fetch(
      `https://good-grades-server.herokuapp.com/api/events/addStudentToEvent`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          ...appointmentData,
          student_id: this.props.user.unique_id
        })
      }
    )
      .then(response => response.json())
      .then(data =>
        console.log("Complete")
      )
      .catch(() => this.setState({ loading: false }));
  }

  header = withStyles(style, { name: 'Header' })(({
    children, appointmentData, classes, ...restProps
  }) => (
    <AppointmentTooltip.Header
      {...restProps}
      appointmentData={appointmentData}
    >
      <IconButton
        /* eslint-disable-next-line no-alert */
        onClick={() => alert(JSON.stringify(appointmentData))}
        className={classes.commandButton}
      >
        <MoreIcon />
      </IconButton>
      <Button onClick={() => this.bookSession(appointmentData)} className={classes.commandButton}>
        Book Session
      </Button>
    </AppointmentTooltip.Header>
  ));
  
  content = withStyles(style, { name: 'Content' })(({
    children, appointmentData, classes, ...restProps
  }) => (
    <AppointmentTooltip.Content {...restProps} appointmentData={appointmentData}>
      <Grid container alignItems="center">
        <Grid item xs={2} className={classes.textCenter}>
          <Room className={classes.icon} />
        </Grid>
        <Grid item xs={10}>
          <span>{appointmentData.location}</span>
        </Grid>
      </Grid>
    </AppointmentTooltip.Content>
  ));
  
  commandButton = withStyles(style, { name: 'CommandButton' })(({
    classes, ...restProps
  }) => (
    <AppointmentTooltip.CommandButton {...restProps} className={classes.commandButton} />
  ));

  render() {
    const {
      currentDate,
      currentViewName,
      data,
      initialData, //using to store tutors initial events and compare to selected tutor's events
      loading,
      addedAppointment,
      appointmentChanges,
      editingAppointmentId,
      resources,
      mainResourceName
    } = this.state;

    return (
      <div>
        <div className='App'>
          <header className='App-header'>
            <ResourceSwitcher
              resources={resources}
              mainResourceName={mainResourceName}
              onChange={this.changeMainResource}
            />
            <Paper>
              <Scheduler data={data} height={700}>
                <ViewState
                  currentDate={currentDate}
                  currentViewName={currentViewName}
                  onCurrentDateChange={this.currentDateChange}
                  onCurrentViewNameChange = {this.currentViewNameChange}
                />
                <EditingState
                  onCommitChanges={this.commitChanges}
                  addedAppointment={addedAppointment}
                  onAddedAppointmentChange={this.changeAddedAppointment}
                  appointmentChanges={appointmentChanges}
                  onAppointmentChangesChange={this.changeAppointmentChanges}
                  editingAppointmentId={editingAppointmentId}
                  onEditingAppointmentIdChange={this.changeEditingAppointmentId}
                />
                
                <WeekView startDayHour={5} endDayHour={23} />
                <DayView startDayHour={0} endDayHour={23} />
                <AllDayPanel />
                {/* <Toolbar
                  {...(loading ? { rootComponent: ToolbarWithLoading } : null)}
                  
                /> */}
                <Toolbar {...(loading ? { rootComponent: ToolbarWithLoading } : null)}>
                  {/* <ResourceSwitcher
                    resources={resources}
                    mainResourceName={mainResourceName}
                    onChange={this.changeMainResource}
                  /> */}
                </Toolbar>
                <ViewSwitcher />
                {this.props.user.type === 'tutor' ? (
                  <EditRecurrenceMenu />
                ) : null}
                <Appointments />
                <AppointmentTooltip 
                  headerComponent={this.header}
                  contentComponent={this.content}
                  commandButtonComponent={this.commandButton}
                  showOpenButton
                  showDeleteButton
                  showCloseButton
                />
                <Resources
                  data={resources}
                  mainResourceName={mainResourceName}
                />
                {this.props.user.type === 'tutor' ? <AppointmentForm /> : null}
                {this.props.user.type === 'tutor' ? (
                  <ConfirmationDialog ignoreDelete />
                ) : null}
                <DragDropProvider />
                <DateNavigator />
                <TodayButton />
                <CurrentTimeIndicator
                  indicatorComponent={TimeIndicator}
                  shadePreviousCells
                  shadePreviousAppointments
                />
              </Scheduler>
            </Paper>
          </header>
        </div>
      </div>
    );
  }
}
